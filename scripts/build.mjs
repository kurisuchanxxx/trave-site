// Generatore del sito statico (IT + EN). Node >= 20, nessuna dipendenza.
//
//   node scripts/build.mjs                         anteprima (noindex) in dist/
//   SHOW_PLACEHOLDERS=1 node scripts/build.mjs     anteprima con contatti segnaposto e stagioni indicative
//   SITE_ENV=production node scripts/build.mjs     produzione: si ferma se mancano dati obbligatori
//   BASE_PATH=/trave-site/                         percorso base, usato solo da 404.html
//   RATES_FILE=/percorso/rates.mjs                 file tariffe alternativo (solo per test in locale)
//
// I contenuti stanno in scripts/data/*.mjs e scripts/copy/{it,en}.mjs.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

import { SITE as SITE_DATA, PREVIEW_PLACEHOLDERS } from './data/site.mjs';
import { PHOTOS, PHOTO, maxW, HERO_SLIDES } from './data/photos.mjs';
import { PLACES } from './data/places.mjs';
import { AMENITIES } from './data/amenities.mjs';
import { FAQ } from './data/faq.mjs';
import IT from './copy/it.mjs';
import EN from './copy/en.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');
const ENV = process.env.SITE_ENV === 'production' ? 'production' : 'preview';
const PROD = ENV === 'production';
const SHOW_PLACEHOLDERS = !PROD && process.env.SHOW_PLACEHOLDERS === '1';
const BASE_PATH = process.env.BASE_PATH || '/';
const { RATES } = await import(process.env.RATES_FILE ? pathToFileURL(resolve(process.env.RATES_FILE)).href : './data/rates.mjs');

const SITE = structuredClone(SITE_DATA);
if (SHOW_PLACEHOLDERS) {
  SITE.phone ??= PREVIEW_PLACEHOLDERS.phone;
  SITE.whatsapp ??= PREVIEW_PLACEHOLDERS.whatsapp;
  SITE.email ??= PREVIEW_PLACEHOLDERS.email;
}
const COPY = { it: IT, en: EN };
const ORIGIN = SITE.origin;
const BUILD_DATE = new Date();

// ---------------------------------------------------------------------------
// Pagine e percorsi
// ---------------------------------------------------------------------------

const PAGES = {
  home: { it: '', en: 'en/' },
  casa: { it: 'la-casa/', en: 'en/the-house/' },
  galleria: { it: 'galleria/', en: 'en/gallery/' },
  dintorni: { it: 'dintorni/', en: 'en/surroundings/' },
  prezzi: { it: 'prezzi/', en: 'en/rates/' },
  contatti: { it: 'contatti/', en: 'en/contact/' },
  privacy: { it: 'privacy/', en: 'en/privacy/' },
};
const NAV = ['casa', 'galleria', 'dintorni', 'prezzi', 'contatti'];

const rel = (from, to) => ('../'.repeat(from.split('/').length - 1) + to) || './';
const abs = path => `${ORIGIN}/${path}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const pad2 = n => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------
// Tariffe: helper condivisi
// ---------------------------------------------------------------------------

const isPrice = v => typeof v === 'number' && v > 0;
const publicSeasons = RATES.seasons.filter(s => s.confirmed || SHOW_PLACEHOLDERS);
const indicative = publicSeasons.some(s => !s.confirmed);
const priced = publicSeasons.filter(s => isPrice(s.nightly));
const hasPrices = priced.length > 0;
const fromPrice = hasPrices ? Math.min(...priced.map(s => s.nightly)) : null;
const maxPrice = hasPrices ? Math.max(...priced.map(s => s.nightly)) : null;
const money = (lang, n) => new Intl.NumberFormat(COPY[lang].locale, { style: 'currency', currency: RATES.currency, maximumFractionDigits: 0 }).format(n);

function seasonFor(md, seasons) {
  const inP = ([a, b]) => (a <= b ? md >= a && md <= b : md >= a || md <= b);
  return seasons.find(s => s.special && s.periods.some(inP)) || seasons.find(s => !s.special && s.periods.some(inP)) || null;
}
const todayMD = `${pad2(BUILD_DATE.getMonth() + 1)}-${pad2(BUILD_DATE.getDate())}`;
const currentSeason = seasonFor(todayMD, publicSeasons);

function formatDay(lang, md, isStart) {
  const [m, d] = md.split('-').map(Number);
  const month = COPY[lang].rates.months[m - 1];
  if (lang === 'en') return `${d} ${month}`;
  const elide = d === 8 || d === 11;
  const prep = isStart ? (elide ? "dall'" : 'dal ') : (elide ? "all'" : 'al ');
  return `${prep}${d} ${month}`;
}
const formatPeriod = (lang, [a, b]) => (lang === 'en' ? `${formatDay(lang, a)} to ${formatDay(lang, b)}` : `${formatDay(lang, a, true)} ${formatDay(lang, b, false)}`);
const formatPeriods = (lang, ps) => ps.map(p => formatPeriod(lang, p)).join(COPY[lang].rates.and);

// ---------------------------------------------------------------------------
// Validazione
// ---------------------------------------------------------------------------

const warnings = [];
const errors = [];
function validate() {
  const need = { cin: SITE.cin, email: SITE.email, phone: SITE.phone, 'legal.controllerName': SITE.legal.controllerName };
  for (const [k, v] of Object.entries(need)) if (!v) (PROD ? errors : warnings).push(`SITE.${k} mancante`);
  for (const k of ['geo', 'whatsapp', 'formEndpoint', 'responseTime', 'cir']) if (!SITE[k]) warnings.push(`SITE.${k} non impostato (componente nascosto)`);
  for (const s of RATES.seasons) {
    if (!s.confirmed) warnings.push(`RATES stagione "${s.id}" non confermata`);
    if (s.nightly === 0) errors.push(`RATES stagione "${s.id}": nightly 0 non ammesso`);
  }
  for (const k of Object.keys(RATES.terms)) if (!RATES.terms[k]) warnings.push(`RATES.terms.${k} non impostato`);
  if (!RATES.touristTax.amountPerPersonNight) warnings.push('RATES.touristTax.amountPerPersonNight non impostato');
}

// Contrasto WCAG sui colori del tema
const TOKENS = {
  calcare: '#F2F1EC', gesso: '#FAFAF7', pietra: '#E4E3DC', ink: '#1A1F1B', muted: '#5A625C', bosco: '#1E2A23', bosco2: '#141C17',
  onDark: '#F2F1EC', onDarkMuted: '#B9BFB4', accent: '#1F6F6B', accentDeep: '#185956', accentOnDark: '#8FC7BF', sabbia: '#CDBB94', error: '#8A2A1F',
};
function contrast(a, b) {
  const lum = hex => {
    const c = hex.match(/\w\w/g).map(x => parseInt(x, 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function checkContrast() {
  const T = TOKENS;
  const pairs = [
    ['ink/calcare', T.ink, T.calcare], ['muted/calcare', T.muted, T.calcare], ['muted/pietra', T.muted, T.pietra], ['muted/gesso', T.muted, T.gesso],
    ['accent/calcare', T.accent, T.calcare], ['accent/pietra', T.accent, T.pietra], ['accent/gesso', T.accent, T.gesso], ['white/accent', '#FFFFFF', T.accent],
    ['onDark/bosco', T.onDark, T.bosco], ['onDarkMuted/bosco', T.onDarkMuted, T.bosco], ['onDarkMuted/bosco2', T.onDarkMuted, T.bosco2],
    ['accentOnDark/bosco', T.accentOnDark, T.bosco], ['bosco/sabbia', T.bosco, T.sabbia], ['bosco/gesso', T.bosco, T.gesso], ['error/calcare', T.error, T.calcare],
    ['sabbia/bosco', T.sabbia, T.bosco],
  ];
  for (const [name, a, b] of pairs) {
    const r = contrast(a, b);
    if (r < 4.5) errors.push(`Contrasto insufficiente ${name}: ${r.toFixed(2)}`);
  }
}

// ---------------------------------------------------------------------------
// Icone (tracciati in stile Lucide, licenza ISC)
// ---------------------------------------------------------------------------

const ICONS = {
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.86a10 10 0 0 1 14 0"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/>',
  snowflake: '<path d="M2 12h20"/><path d="M12 2v20"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  washer: '<path d="M3 6h3"/><path d="M17 6h.01"/><rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5"/>',
  beams: '<path d="M2 20 8 4"/><path d="M9 20 11 4"/><path d="M15 20 13 4"/><path d="M22 20 16 4"/><path d="M2 20h20"/><path d="M5 12h14"/>',
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  tv: '<rect width="20" height="15" x="2" y="7" rx="2"/><path d="m17 2-5 5-5-5"/>',
  fence: '<path d="M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z"/><path d="M6 8h4"/><path d="M6 18h4"/><path d="m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z"/><path d="M14 8h4"/><path d="M14 18h4"/><path d="m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  gate: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  door: '<path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  clockIn: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  clockOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  whatsapp: '<path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  pin: '<path d="M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  play: '<path d="M6 3v18l14-9z"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  train: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  pen: '<path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  home: '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h8"/>',
  map: '<path d="M14.1 5.9 9.9 3.8a2 2 0 0 0-1.8 0L3.6 6.1A1 1 0 0 0 3 7v12.3a1 1 0 0 0 1.4.9l3.7-1.8a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9V5.7a1 1 0 0 0-1.4-.9l-3.7 1.8a2 2 0 0 1-1.8 0z"/><path d="M15 5.8v15"/><path d="M9 3.2v15"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
};

// ---------------------------------------------------------------------------
// Rendering: contesto per pagina
// ---------------------------------------------------------------------------

function makeCtx(lang, key) {
  const slug = key === 'notFound' ? '' : PAGES[key][lang];
  const C = COPY[lang];
  const used = new Set();
  const ctx = {
    lang, key, slug, C, used,
    r: p => rel(slug, p),
    P: (k, hash = '') => rel(slug, PAGES[k][lang]) + hash,
    i: (name, cls = '') => { used.add(name); return `<svg class="i${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`; },
  };
  return ctx;
}

function sprite(used) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="sprite" aria-hidden="true" focusable="false">${[...used].map(n => `<symbol id="i-${n}" viewBox="0 0 24 24">${ICONS[n]}</symbol>`).join('')}</svg>`;
}

// ---------------------------------------------------------------------------
// Immagini
// ---------------------------------------------------------------------------

const SIZES = {
  hero: '(max-width: 1023px) 100vw, 576px',
  landscape: '(max-width: 767px) calc(100vw - 32px), 880px',
  band: '(max-width: 1055px) calc(100vw - 32px), 1024px',
  portrait: '(max-width: 767px) calc(100vw - 32px), 460px',
  narrow: '(max-width: 767px) 33vw, 260px',
  detail: '(max-width: 519px) calc(100vw - 32px), 480px',
  thumb: '(max-width: 767px) 50vw, 360px',
};
function srcset(ctx, p) {
  return p.w > 640 ? `${ctx.r(`images/${p.key}-640.webp`)} 640w, ${ctx.r(`images/${p.key}.webp`)} ${p.w}w` : `${ctx.r(`images/${p.key}.webp`)} ${p.w}w`;
}
function pic(ctx, key, { eager = false, sizes = SIZES.portrait, alt, focal } = {}) {
  const p = PHOTO[key];
  const a = alt ?? p.alt[ctx.lang];
  const load = eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"';
  const pos = focal || p.focal;
  return `<picture><source type="image/webp" srcset="${srcset(ctx, p)}" sizes="${sizes}"><img src="${ctx.r(`images/${p.key}.jpg`)}" width="${p.w}" height="${p.h}" alt="${esc(a)}"${load}${pos ? ` style="object-position:${pos}"` : ''}></picture>`;
}
function plate(ctx, key, { sizes, eager = false, ratio, cap, caption, cls = '', focal } = {}) {
  const p = PHOTO[key];
  const mw = cap || maxW(p);
  const ar = ratio || `${p.w} / ${p.h}`;
  const cap2 = caption ?? p.caption[ctx.lang];
  return `<figure class="plate ${cls}" style="--mw:${mw}px">
        <div class="plate-frame" style="aspect-ratio:${ar}">${pic(ctx, key, { eager, sizes, focal })}</div>
        <figcaption><span class="tav">${ctx.C.common.photoPlate} ${pad2(p.tav)}</span> ${esc(cap2)}</figcaption>
      </figure>`;
}
const bdCache = {};
function backdrop(key) {
  if (key in bdCache) return bdCache[key];
  const f = join(ROOT, 'images', `${key}-bd.webp`);
  bdCache[key] = existsSync(f) ? `data:image/webp;base64,${readFileSync(f).toString('base64')}` : null;
  return bdCache[key];
}

// ---------------------------------------------------------------------------
// Componenti
// ---------------------------------------------------------------------------

const waHref = (lang, text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text || COPY[lang].common.whatsappText)}`;

function langSwitch(ctx, cls = '') {
  const { key } = ctx;
  const k = key === 'notFound' ? 'home' : key;
  return `<div class="lang ${cls}">
        <a href="${ctx.r(PAGES[k].it)}" hreflang="it" lang="it" aria-label="Italiano"${ctx.lang === 'it' ? ' aria-current="true"' : ''}>IT</a>
        <a href="${ctx.r(PAGES[k].en)}" hreflang="en" lang="en" aria-label="English"${ctx.lang === 'en' ? ' aria-current="true"' : ''}>EN</a>
      </div>`;
}

function contactLinks(ctx, { cls = '', labels = false } = {}) {
  const { C } = ctx;
  const out = [];
  if (SITE.phone) out.push(`<a class="${cls}" href="tel:${SITE.phone.e164}" data-cta="call">${ctx.i('phone')}<span>${labels ? `<small>${C.common.call}</small>` : ''}${SITE.phone.display}</span></a>`);
  if (SITE.whatsapp) out.push(`<a class="${cls}" href="${waHref(ctx.lang)}" target="_blank" rel="noopener" data-cta="whatsapp">${ctx.i('whatsapp')}<span>${labels ? `<small>WhatsApp</small>` : ''}${labels ? SITE.phone?.display || 'WhatsApp' : 'WhatsApp'}</span></a>`);
  if (SITE.email) out.push(`<a class="${cls}" href="mailto:${SITE.email}" data-cta="email">${ctx.i('mail')}<span>${labels ? `<small>${C.common.email}</small>` : ''}${SITE.email}</span></a>`);
  return out.join('\n        ');
}

function topbar(ctx) {
  return `<div class="topbar">
    <div class="wrap topbar-in">
      <p class="topbar-official">${ctx.C.common.official} · ${SITE.address.short}</p>
      <div class="topbar-links">
        ${contactLinks(ctx)}
        ${langSwitch(ctx)}
      </div>
    </div>
  </div>`;
}

function brand(ctx) {
  return `<a class="brand" href="${ctx.P('home')}" aria-label="${SITE.name}, home">
        <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="32" y="39" text-anchor="middle">125</text></svg>
        <span class="brand-text"><span class="brand-name">${SITE.name}</span><span class="brand-sub">${ctx.C.common.brandSub}</span></span>
      </a>`;
}

function header(ctx) {
  const { C } = ctx;
  const navLinks = NAV.map(k => `<a href="${ctx.P(k)}"${k === ctx.key ? ' aria-current="page"' : ''}>${C.common.nav[k]}</a>`).join('');
  const menuLinks = ['home', ...NAV].map((k, i) => `<li><a href="${ctx.P(k)}"${k === ctx.key ? ' aria-current="page"' : ''}><span class="menu-n">${pad2(i + 1)}</span>${C.common.nav[k]}</a></li>`).join('');
  return `<header class="site-header" id="header">
    <div class="wrap header-in">
      ${brand(ctx)}
      <nav class="nav" aria-label="${ctx.lang === 'it' ? 'Principale' : 'Main'}">${navLinks}</nav>
      <a class="btn btn-header" href="${ctx.P('contatti', '#richiesta')}" data-cta="header">${C.common.check}</a>
      <div class="header-mobile">
        ${SITE.phone ? `<a class="icon-btn" href="tel:${SITE.phone.e164}" aria-label="${C.common.call}" data-cta="call_header">${ctx.i('phone')}</a>` : ''}
        <a class="menu-btn" href="#footer-nav" aria-controls="menu" aria-expanded="false">${ctx.i('menu')}<span>${C.common.menu}</span></a>
      </div>
    </div>
  </header>
  <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${C.common.menu}" hidden>
    <div class="menu-top wrap">
      ${brand(ctx)}
      <button class="menu-close icon-btn" type="button" aria-label="${C.common.close}">${ctx.i('close')}</button>
    </div>
    <div class="menu-body wrap">
      <ol class="menu-nav">${menuLinks}</ol>
      <div class="menu-contacts">${contactLinks(ctx, { cls: 'menu-contact' })}</div>
      ${langSwitch(ctx, 'lang-light')}
      <p class="menu-foot">${C.common.official} · ${SITE.address.display}</p>
    </div>
  </div>`;
}

function crumbs(ctx) {
  const { C } = ctx;
  return `<nav class="crumbs" aria-label="${C.common.breadcrumb}"><ol><li><a href="${ctx.P('home')}">${C.common.nav.home}</a></li><li aria-hidden="true">/</li><li><span aria-current="page">${C.common.nav[ctx.key] || C.pages[ctx.key].eyebrow}</span></li></ol></nav>`;
}

function cartouche(ctx, { plateKey, plateOpts = {} } = {}) {
  const pg = ctx.C.pages[ctx.key];
  const bdKey = plateKey || 'giardino-vista-conero';
  const bd = backdrop(bdKey);
  const veil = PHOTO[bdKey].veil || 0.7;
  return `<section class="cartouche${plateKey ? ' has-plate' : ''}">
    ${bd ? `<div class="bd is-on" aria-hidden="true" style="--bd:url(${bd});--veil:${veil}"></div>` : ''}
    <div class="wrap cartouche-in">
      ${ctx.key !== 'notFound' ? crumbs(ctx) : ''}
      <p class="eyebrow eyebrow-dark">${pg.eyebrow || ''}</p>
      <h1>${pg.h1}</h1>
      <p class="lead lead-dark">${pg.lead}</p>
      ${plateOpts.actions || ''}
    </div>
  </section>
  ${plateKey ? `<div class="wrap cartouche-plate">${plate(ctx, plateKey, { eager: true, sizes: PHOTO[plateKey].w > PHOTO[plateKey].h ? (PHOTO[plateKey].role === 'band' ? SIZES.band : SIZES.landscape) : SIZES.portrait, ...plateOpts })}</div>` : ''}`;
}

function sectionHead(ctx, n, eyebrow, h2, { lead = '', link = '', id = '' } = {}) {
  return `<div class="shead">
        <div class="shead-main">
          <p class="eyebrow"><span class="shead-n">${pad2(n)}</span> · ${eyebrow}</p>
          <h2${id ? ` id="${id}"` : ''}>${h2}</h2>
        </div>
        ${lead || link ? `<div class="shead-side">${lead ? `<p class="lead">${lead}</p>` : ''}${link}</div>` : ''}
      </div>`;
}
const linkArrow = (ctx, href, text, attrs = '') => `<a class="link-arrow" href="${href}"${attrs}>${text}${ctx.i('arrow')}</a>`;

function bookingBar(ctx, { variant = 'compact', target = 'contatti' } = {}) {
  const { C } = ctx;
  const action = target === 'self' ? '#richiesta' : ctx.P('contatti', '#richiesta');
  const opts = [1, 2, 3, 4, 5, 6].map(n => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`).join('');
  const id = `bk-${variant}`;
  return `<form class="booking booking-${variant}" id="${variant === 'slab' ? 'booking' : `booking-${variant}`}" action="${action}" method="get" role="search" aria-label="${C.booking.label}" novalidate>
        <div class="booking-cells">
          <label class="bcell" for="${id}-in"><span class="blabel">${C.booking.checkin}</span><input id="${id}-in" type="date" name="checkin" required></label>
          <label class="bcell" for="${id}-out"><span class="blabel">${C.booking.checkout}</span><input id="${id}-out" type="date" name="checkout" required></label>
          <label class="bcell" for="${id}-g"><span class="blabel">${C.booking.guests} <span class="bhelp">${C.booking.max}</span></span><select id="${id}-g" name="guests">${opts}</select></label>
          <button class="btn btn-primary bsubmit" type="submit" data-cta="booking_${ctx.key}">${C.booking.submit}${ctx.i('arrow')}</button>
        </div>
        <p class="booking-err" id="${id}-err" role="alert" hidden>${C.booking.errDates}</p>
        <p class="booking-micro">${C.booking.micro}</p>
      </form>`;
}

function factsStrip(ctx) {
  return `<dl class="facts">${ctx.C.facts.map(([n, l]) => `<div class="fact"><dt>${l}</dt><dd>${n}</dd></div>`).join('')}</dl>`;
}

function trustStrip(ctx) {
  const { C } = ctx;
  const cells = [
    `<a href="${ctx.P('contatti', '#mappa')}">${ctx.i('pin')}${SITE.address.short}</a>`,
    `<span>${ctx.i('home')}${C.trust.whole}</span>`,
    `<span>${ctx.i('gate')}${C.trust.parking}</span>`,
    `<span>${ctx.i('paw')}${C.trust.pets}</span>`,
    `<span>${ctx.i('languages')}${C.trust.lang}</span>`,
  ];
  if (SITE.cin) cells.push(`<span>${ctx.i('shield')}${fill(C.trust.cin, { cin: SITE.cin })}</span>`);
  const ls = SITE.trust.locationScore;
  if (SITE.trust.showLocationScore && ls.url && ls.checkedOn && ctx.key !== 'prezzi') {
    cells.push(`<a href="${ls.url}" target="_blank" rel="noopener">${ctx.i('check')}${fill(C.trust.score, { value: ctx.lang === 'it' ? ls.value : ls.valueEn, source: ls.source, date: ls.checkedOn })}</a>`);
  }
  return `<div class="trust"><ul class="wrap trust-in">${cells.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
}

function directBand(ctx) {
  const { C } = ctx;
  const icons = ['chat', 'pen', 'check'];
  const perks = SITE.perks.filter(p => p.enabled && p.text[ctx.lang]);
  const promo = SITE.promo.code && SITE.promo.benefit[ctx.lang];
  return `<section class="direct" aria-labelledby="direct-${ctx.key}">
    <div class="wrap direct-in">
      <div class="direct-lead">
        <p class="eyebrow">${C.direct.eyebrow}</p>
        <p class="h2" id="direct-${ctx.key}">${C.direct.title}</p>
        <p>${C.direct.line}</p>
      </div>
      <ul class="direct-list">
        ${C.direct.benefits.map((b, i) => `<li>${ctx.i(icons[i])}${b}</li>`).join('\n        ')}
        ${perks.length ? `<li class="direct-perks-title">${C.direct.perksTitle}</li>${perks.map(p => `<li>${ctx.i('check')}${p.text[ctx.lang]}</li>`).join('')}` : ''}
      </ul>
      <div class="direct-cta">
        <a class="btn btn-primary" href="${ctx.key === 'prezzi' || ctx.key === 'contatti' ? '#richiesta' : ctx.P('contatti', '#richiesta')}" data-cta="direct_${ctx.key}">${C.common.request}${ctx.i('arrow')}</a>
        ${promo ? `<div class="promo"><p class="promo-code"><span id="promo-${ctx.key}">${SITE.promo.code}</span><button type="button" class="promo-copy" data-copy="promo-${ctx.key}" data-done="${C.direct.copied}" aria-label="${C.direct.copy}">${ctx.i('copy')}</button></p><p>${SITE.promo.benefit[ctx.lang]}</p>${SITE.promo.terms[ctx.lang] ? `<p class="small">${SITE.promo.terms[ctx.lang]}</p>` : ''}<span class="sr-only" aria-live="polite"></span></div>` : ''}
      </div>
    </div>
  </section>`;
}

function ctaBand(ctx) {
  const { C } = ctx;
  return `<section class="cta-band" aria-labelledby="cta-${ctx.key}">
    <div class="wrap cta-in">
      <figure class="cta-plate" aria-hidden="true">${pic(ctx, 'vista-dalla-finestra', { sizes: '240px', alt: '', focal: '50% 10%' })}</figure>
      <div class="cta-text">
        <p class="eyebrow eyebrow-sabbia">${C.ctaBand.eyebrow}</p>
        <p class="h2 cta-title" id="cta-${ctx.key}">${C.ctaBand.title}</p>
        <p class="cta-line">${C.ctaBand.line}</p>
        <div class="cta-actions">
          <a class="btn btn-light" href="${ctx.key === 'prezzi' || ctx.key === 'contatti' ? '#richiesta' : ctx.P('contatti', '#richiesta')}" data-cta="band_${ctx.key}">${C.common.request}${ctx.i('arrow')}</a>
          ${SITE.whatsapp ? `<a class="btn btn-ghost" href="${waHref(ctx.lang)}" target="_blank" rel="noopener" data-cta="whatsapp">${ctx.i('whatsapp')}${C.common.whatsapp}</a>` : ''}
          ${SITE.phone ? `<a class="btn btn-ghost" href="tel:${SITE.phone.e164}" data-cta="call">${ctx.i('phone')}${C.common.call}</a>` : ''}
        </div>
        <p class="cta-small">${C.ctaBand.small}</p>
      </div>
    </div>
  </section>`;
}

function footer(ctx) {
  const { C } = ctx;
  const year = BUILD_DATE.getFullYear();
  return `<footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        ${brand(ctx)}
        <address>${SITE.address.display}</address>
        <p>${linkArrow(ctx, ctx.P('dintorni', '#come-arrivare'), C.footer.howTo)}</p>
      </div>
      <div>
        <p class="footer-title">${C.footer.contacts}</p>
        <div class="footer-contacts">${contactLinks(ctx)}</div>
        ${SITE.responseTime ? `<p>${fill(C.footer.response, { t: SITE.responseTime[ctx.lang] })}</p>` : ''}
      </div>
      <nav id="footer-nav" aria-label="${C.footer.pages}">
        <p class="footer-title">${C.footer.pages}</p>
        <ul>${['home', ...NAV].map(k => `<li><a href="${ctx.P(k)}">${k === 'prezzi' ? C.footer.rates : C.common.nav[k]}</a></li>`).join('')}</ul>
        ${langSwitch(ctx)}
      </nav>
      <div>
        <p class="footer-title">${C.footer.info}</p>
        <ul class="footer-info">
          ${SITE.cin ? `<li>CIN ${SITE.cin}</li>` : ''}
          ${SITE.cir ? `<li>CIR ${SITE.cir}</li>` : ''}
          <li>${C.footer.times}</li>
          <li>${C.footer.langs}</li>
          ${SITE.legal.controllerName ? `<li>${SITE.legal.controllerName}</li>` : ''}
        </ul>
      </div>
    </div>
    <div class="wrap footer-bottom">
      <p>© ${year} ${SITE.name} · ${SITE.address.display}</p>
      <p><a href="${ctx.P('privacy')}">${C.footer.privacy}</a> · <a href="${ctx.P('privacy', '#cookie')}">${C.footer.cookie}</a> · <span>${C.footer.madeBy}</span></p>
    </div>
  </footer>`;
}

function stickyCta(ctx) {
  if (ctx.key === 'contatti' || ctx.key === 'privacy' || ctx.key === 'notFound') return '';
  const { C } = ctx;
  const href = ctx.key === 'home' ? '#booking' : ctx.key === 'prezzi' ? '#richiesta' : ctx.P('contatti', '#richiesta');
  return `<div class="sticky" id="sticky" hidden>
    <p class="sticky-text"><span>${C.sticky.line1}</span><span>${hasPrices ? fill(C.sticky.from, { price: money(ctx.lang, fromPrice) }) : C.sticky.onRequest}</span></p>
    <div class="sticky-actions">
      ${SITE.whatsapp ? `<a class="icon-btn" href="${waHref(ctx.lang)}" target="_blank" rel="noopener" aria-label="WhatsApp" data-cta="whatsapp_sticky">${ctx.i('whatsapp')}</a>` : ''}
      ${SITE.phone ? `<a class="icon-btn" href="tel:${SITE.phone.e164}" aria-label="${C.common.call}" data-cta="call_sticky">${ctx.i('phone')}</a>` : ''}
      <a class="btn btn-primary" href="${href}" data-cta="sticky">${C.common.checkShort}</a>
    </div>
  </div>`;
}

function requestForm(ctx) {
  const { C } = ctx;
  const F = C.form;
  const opts = [1, 2, 3, 4, 5, 6].map(n => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`).join('');
  const action = SITE.formEndpoint ? ` action="${SITE.formEndpoint}" method="post"` : ' method="post"';
  return `<div class="request-card" id="richiesta" tabindex="-1">
        <p class="h3">${F.title}</p>
        <p class="request-hint">${F.hint}</p>
        <form class="request" id="request-form"${action} novalidate data-mailto="${SITE.email || ''}" data-subject="${esc(F.subject)}" data-lang="${ctx.lang}" data-labels="${esc(JSON.stringify({ name: F.name, email: F.email, phone: F.phone, checkin: F.checkin, checkout: F.checkout, guests: F.guests, pets: F.pets, message: F.message, ...F.fields }))}">
          <div class="fgrid">
            <div class="field full"><label for="f-name">${F.name}</label><input id="f-name" name="name" autocomplete="name" required aria-describedby="f-name-err"><p class="ferr" id="f-name-err" hidden>${F.errRequired}</p></div>
            <div class="field"><label for="f-email">${F.email}</label><input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="f-email-err"><p class="ferr" id="f-email-err" hidden>${F.errEmail}</p></div>
            <div class="field"><label for="f-phone">${F.phone} <span class="opt">${F.optional}</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
            <div class="field"><label for="f-in">${F.checkin}</label><input id="f-in" name="checkin" type="date" required aria-describedby="f-in-err"><p class="ferr" id="f-in-err" hidden>${F.errRequired}</p></div>
            <div class="field"><label for="f-out">${F.checkout}</label><input id="f-out" name="checkout" type="date" required aria-describedby="f-out-err"><p class="ferr" id="f-out-err" hidden>${C.booking.errDates}</p></div>
            <div class="field"><label for="f-guests">${F.guests}</label><select id="f-guests" name="guests">${opts}</select></div>
            <fieldset class="field"><legend>${F.pets}</legend><div class="radios"><label><input type="radio" name="pets" value="no" checked> ${F.no}</label><label><input type="radio" name="pets" value="${ctx.lang === 'it' ? 'si' : 'yes'}"> ${F.yes}</label></div></fieldset>
            <div class="field full"><label for="f-msg">${F.message} <span class="opt">${F.optional}</span></label><textarea id="f-msg" name="message" rows="4" placeholder="${esc(F.messagePh)}"></textarea></div>
            <input type="hidden" name="season" value=""><input type="hidden" name="estimate" value=""><input type="hidden" name="lang" value="${ctx.lang}">
            <div class="hp" aria-hidden="true"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></div>
          </div>
          <p class="request-privacy">${F.privacy} <a href="${ctx.P('privacy')}">${F.privacyLink}</a></p>
          <button class="btn btn-primary btn-block" type="submit" data-cta="form_${ctx.key}">${F.submit}${ctx.i('arrow')}</button>
          <p class="request-micro">${F.hint}</p>
          ${SITE.email || SITE.phone ? `<noscript><p class="request-micro">${fill(F.noscript, { email: SITE.email || '', phone: SITE.phone?.display || '' })}</p></noscript>` : ''}
        </form>
        <div class="request-done" role="status" tabindex="-1" hidden>
          <p class="h3">${F.success}</p>
          <p class="done-mail" hidden>${F.successMail}</p>
          ${SITE.whatsapp ? `<p>${F.successWa} <a href="${waHref(ctx.lang)}" target="_blank" rel="noopener">WhatsApp</a></p>` : ''}
        </div>
      </div>`;
}

function faqBlock(ctx, page) {
  const items = FAQ.filter(f => f.status === 'confirmed' && f.pages.includes(page));
  return {
    html: `<div class="faq">${items.map(f => `<details><summary>${f.q[ctx.lang]}<span class="faq-sign" aria-hidden="true"></span></summary><p>${f.a[ctx.lang]}</p></details>`).join('\n        ')}</div>`,
    schema: { '@type': 'FAQPage', '@id': `${abs(ctx.slug)}#faq`, mainEntity: items.map(f => ({ '@type': 'Question', name: f.q[ctx.lang], acceptedAnswer: { '@type': 'Answer', text: f.a[ctx.lang] } })) },
  };
}

function amenityRows(ctx, list) {
  return `<ul class="amen">${list.map(a => `<li class="amen-row${a.group === 'no' ? ' is-no' : ''}">${ctx.i(a.icon)}<span class="amen-label">${a.label[ctx.lang]}</span><span class="amen-note">${a.note[ctx.lang]}</span></li>`).join('')}</ul>`;
}

function timetable(ctx, limit) {
  const nf = new Intl.NumberFormat(ctx.C.locale, { maximumFractionDigits: 1 });
  const rows = PLACES.slice(0, limit || PLACES.length);
  const dist = p => (p.km < 1 ? `${Math.round(p.km * 1000)} m` : `${p.approx ? (ctx.lang === 'it' ? 'circa ' : 'about ') : ''}${nf.format(p.km)} km`);
  return `<ol class="timetable">${rows.map(p => `<li><span class="tt-name">${p.heading ? `<a href="${ctx.key === 'dintorni' ? '' : ctx.P('dintorni')}#${p.id}">${p.name[ctx.lang]}</a>` : p.name[ctx.lang]}</span><span class="tt-dots" aria-hidden="true"></span><span class="tt-dist">${dist(p)}</span></li>`).join('')}</ol>`;
}

function mapBlock(ctx) {
  const { C } = ctx;
  const g = SITE.geo;
  const src = g ? `https://www.openstreetmap.org/export/embed.html?bbox=${(g.lng - 0.02).toFixed(5)},${(g.lat - 0.012).toFixed(5)},${(g.lng + 0.02).toFixed(5)},${(g.lat + 0.012).toFixed(5)}&layer=mapnik&marker=${g.lat},${g.lng}` : '';
  return `<div class="mapbox"${src ? ` data-src="${src}" data-title="${esc(C.map.title)}"` : ''}>
        <div class="mapbox-in">
          ${ctx.i('pin', 'i-lg')}
          <p class="mapbox-addr">${SITE.address.display}</p>
          ${src ? `<button class="btn btn-secondary map-load" type="button">${ctx.i('map')}${C.map.load}</button><p class="small">${C.map.note}</p>` : ''}
          <a class="link-arrow" href="${SITE.maps}" target="_blank" rel="noopener" data-cta="directions">${C.common.directions}${ctx.i('arrow')}</a>
        </div>
      </div>`;
}

// ---------------------------------------------------------------------------
// Tariffe: rendering
// ---------------------------------------------------------------------------

function ratesTable(ctx, { compact = false } = {}) {
  const { C } = ctx;
  const R = C.rates;
  const list = compact ? publicSeasons.filter(s => ['low', 'mid', 'high', 'peak'].includes(s.id)).slice(0, 4) : publicSeasons;
  const target = s => (ctx.key === 'prezzi' ? `?season=${s.id}#richiesta` : `${ctx.P('contatti')}?season=${s.id}#richiesta`);
  const rows = list.map(s => {
    const price = isPrice(s.nightly)
      ? `<data value="${s.nightly}" class="rate-price">${R.from} ${money(ctx.lang, s.nightly)}</data> <span class="rate-unit">${R.perNight}</span>${s.weekly && !compact ? `<span class="rate-week">${money(ctx.lang, s.weekly)} ${R.perWeek}</span>` : ''}`
      : `<span class="rate-req">${R.onRequest}</span>`;
    const min = s.minNights ? fill(R.minN, { n: s.minNights }) : R.minNull;
    const cur = currentSeason && currentSeason.id === s.id;
    return `<tr class="${s.special ? 'is-special' : ''}${cur ? ' is-current' : ''}" data-season="${s.id}">
            <th scope="row" data-label="${R.cols[0]}"><span class="rate-name">${s.name[ctx.lang]}</span>${cur ? `<span class="rate-current">${R.current}</span>` : ''}${s.changeoverDay != null && !compact ? `<span class="rate-change">${fill(R.changeover, { day: R.days[s.changeoverDay] })}</span>` : ''}</th>
            <td data-label="${R.cols[1]}">${formatPeriods(ctx.lang, s.periods)}</td>
            <td data-label="${R.cols[2]}">${price}</td>
            ${compact ? '' : `<td data-label="${R.cols[3]}">${min}</td>`}
            ${compact ? '' : `<td class="rate-action"><a class="link-arrow" href="${target(s)}" data-season-link="${s.id}" data-cta="rates_season_${s.id}">${isPrice(s.nightly) ? R.ask : R.askRate}${ctx.i('arrow')}</a></td>`}
          </tr>`;
  }).join('');
  const notes = [];
  if (indicative) notes.push(R.noteIndicative); else if (!hasPrices) notes.push(R.noteHouse);
  if (RATES.lastUpdated) {
    const [y, m, d] = RATES.lastUpdated.split('-').map(Number);
    notes.push(fill(R.updated, { date: ctx.lang === 'it' ? `${d} ${R.months[m - 1]} ${y}` : `${d} ${R.months[m - 1]} ${y}` }));
  }
  return `<div class="rates-wrap">
        <table class="rates${compact ? ' rates-compact' : ''}">
          <caption class="${compact ? 'sr-only' : 'rates-caption'}">${R.caption}</caption>
          <thead><tr><th scope="col">${R.cols[0]}</th><th scope="col">${R.cols[1]}</th><th scope="col">${R.cols[2]}</th>${compact ? '' : `<th scope="col">${R.cols[3]}</th><th scope="col"><span class="sr-only">${ctx.lang === 'it' ? 'Azione' : 'Action'}</span></th>`}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${notes.length ? `<p class="rates-note">${notes.join(' ')}</p>` : ''}
      </div>`;
}

function ratesStatement(ctx) {
  const R = ctx.C.rates;
  return `<div class="statement">
        <p class="h3">${R.statementTitle}</p>
        <p>${R.statementLine}</p>
        ${bookingBar(ctx, { variant: 'mini', target: ctx.key === 'prezzi' ? 'self' : 'contatti' })}
      </div>`;
}

const ratesBlock = (ctx, opts) => (publicSeasons.length ? ratesTable(ctx, opts) : ratesStatement(ctx));

function ratesData() {
  return JSON.stringify({
    currency: RATES.currency, minStayRule: RATES.minStayRule,
    seasons: publicSeasons.map(s => ({ id: s.id, name: s.name, periods: s.periods, nightly: isPrice(s.nightly) ? s.nightly : null, weekly: isPrice(s.weekly) ? s.weekly : null, minNights: s.minNights, changeoverDay: s.changeoverDay, special: s.special })),
    extras: RATES.extras.filter(e => typeof e.amount === 'number').map(e => ({ key: e.key, label: e.label, amount: e.amount, per: e.per, mandatory: e.mandatory })),
    touristTax: RATES.touristTax.amountPerPersonNight ? { rate: RATES.touristTax.amountPerPersonNight, maxNights: RATES.touristTax.maxNights, exemptUnderAge: RATES.touristTax.exemptUnderAge } : null,
  });
}

function estimator(ctx) {
  if (!hasPrices) return '';
  const E = ctx.C.rates.estimator;
  const B = ctx.C.booking;
  const opts = [1, 2, 3, 4, 5, 6].map(n => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`).join('');
  return `<div class="estimator" id="estimator" data-copy="${esc(JSON.stringify({ ...E, locale: ctx.C.locale, lang: ctx.lang }))}">
          <p class="est-title">${ctx.i('calc')}${E.title}</p>
          <div class="est-fields">
            <label>${B.checkin}<input type="date" name="checkin"></label>
            <label>${B.checkout}<input type="date" name="checkout"></label>
            <label>${B.guests}<select name="guests">${opts}</select></label>
          </div>
          <div class="est-out" aria-live="polite"></div>
          <button class="btn btn-primary btn-block est-cta" type="button" data-cta="rates_estimator" hidden>${E.cta}${ctx.i('arrow')}</button>
        </div>`;
}

function includedBlock(ctx) {
  const I = ctx.C.pages.prezzi.included;
  const inc = RATES.included.filter(x => x.confirmed);
  const know = [];
  const cleaning = RATES.extras.find(e => e.key === 'cleaning');
  if (cleaning && cleaning.included === true) know.push([I.cleaning, I.cleaningIncluded]);
  else if (cleaning && typeof cleaning.amount === 'number') know.push([I.cleaning, cleaning.amount === 0 ? I.cleaningIncluded : money(ctx.lang, cleaning.amount)]);
  know.push([I.tax, RATES.touristTax.amountPerPersonNight ? fill(I.taxAmount, { amount: money(ctx.lang, RATES.touristTax.amountPerPersonNight) }) : I.taxText]);
  if (RATES.terms.securityDeposit) know.push([I.deposit, RATES.terms.securityDeposit[ctx.lang] || RATES.terms.securityDeposit]);
  know.push([I.payment, RATES.terms.paymentMethods?.[ctx.lang] || I.terms]);
  know.push([I.cots, I.cotsText]);
  know.push([I.smoking, I.smokingText]);
  return `<div class="included">
        <div>
          <p class="h3">${I.always}</p>
          <ul class="checklist">${inc.map(x => `<li>${ctx.i('check')}${x.label[ctx.lang]}</li>`).join('')}</ul>
        </div>
        <div>
          <p class="h3">${I.know}</p>
          <dl class="know">${know.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        </div>
      </div>`;
}

// ---------------------------------------------------------------------------
// Schema.org
// ---------------------------------------------------------------------------

function lodgingNode(lang, { full = true, withOffers = false } = {}) {
  const node = { '@type': 'LodgingBusiness', '@id': `${ORIGIN}/#lodging` };
  if (!full) return node;
  Object.assign(node, {
    name: SITE.name, alternateName: SITE.alternateName,
    description: COPY[lang].pages.home.desc, url: abs(PAGES.home[lang]),
    image: ['casa-esterno-cortile', 'giardino-palma-mare', 'tramonto-giardino', 'camera-matrimoniale', 'spiaggia-mezzavalle-conero'].map(k => abs(`images/${k}.jpg`)),
    address: { '@type': 'PostalAddress', streetAddress: `${SITE.address.street}, ${SITE.address.frazione}`, addressLocality: SITE.address.city, addressRegion: SITE.address.province, postalCode: SITE.address.zip, addressCountry: SITE.address.country },
    hasMap: SITE.maps, checkinTime: '15:00:00', checkoutTime: '10:00:00', petsAllowed: true, smokingAllowed: false,
    availableLanguage: [{ '@type': 'Language', name: 'Italian', alternateName: 'it' }, { '@type': 'Language', name: 'English', alternateName: 'en' }],
    amenityFeature: AMENITIES.filter(a => a.schema).map(a => ({ '@type': 'LocationFeatureSpecification', name: a.schema[lang], value: true })),
    containsPlace: { '@id': `${ORIGIN}/#house` },
  });
  if (PROD || !SHOW_PLACEHOLDERS) {
    if (SITE.phone) node.telephone = SITE.phone.e164;
    if (SITE.email) node.email = SITE.email;
  }
  if (SITE.geo) node.geo = { '@type': 'GeoCoordinates', latitude: +SITE.geo.lat.toFixed(5), longitude: +SITE.geo.lng.toFixed(5) };
  if (SITE.cin) node.identifier = { '@type': 'PropertyValue', propertyID: 'CIN', value: SITE.cin };
  if (SITE.bookingUrl) node.sameAs = [SITE.bookingUrl[lang]];
  if (withOffers && hasPrices) {
    node.priceRange = `EUR ${fromPrice}-${maxPrice} ${lang === 'it' ? 'per notte' : 'per night'}`;
    node.makesOffer = priced.flatMap(s => {
      const base = {
        '@type': 'Offer', name: s.name[lang], url: abs(PAGES.prezzi[lang]), priceCurrency: RATES.currency,
        priceSpecification: { '@type': 'UnitPriceSpecification', price: s.nightly, priceCurrency: RATES.currency, unitText: lang === 'it' ? 'notte' : 'night', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' } },
      };
      if (s.minNights) base.eligibleDuration = { '@type': 'QuantitativeValue', minValue: s.minNights, unitCode: 'DAY' };
      if (!RATES.validYear) return [base];
      const y = RATES.validYear;
      return s.periods.flatMap(([a, b]) => (a <= b ? [[`${y}-${a}`, `${y}-${b}`]] : [[`${y}-${a}`, `${y}-12-31`], [`${y + 1}-01-01`, `${y + 1}-${b}`]])
        .map(([f, t]) => ({ ...base, validFrom: f, validThrough: t })));
    });
  }
  return node;
}

function houseNode(lang, withAmenities = false) {
  const node = {
    '@type': 'House', '@id': `${ORIGIN}/#house`, name: lang === 'it' ? `${SITE.name}, casa intera` : `${SITE.name}, entire house`,
    floorSize: { '@type': 'QuantitativeValue', value: 110, unitCode: 'MTK' }, numberOfBedrooms: 2, numberOfBathroomsTotal: 2,
    occupancy: { '@type': 'QuantitativeValue', maxValue: 6 },
    bed: [{ '@type': 'BedDetails', numberOfBeds: 1, typeOfBed: 'Double' }, { '@type': 'BedDetails', numberOfBeds: 2, typeOfBed: 'Single' }, { '@type': 'BedDetails', numberOfBeds: 1, typeOfBed: 'Sofa bed' }],
    petsAllowed: true, containedInPlace: { '@id': `${ORIGIN}/#lodging` },
  };
  if (withAmenities) node.amenityFeature = AMENITIES.filter(a => a.group !== 'no' && a.group !== 'regole').map(a => ({ '@type': 'LocationFeatureSpecification', name: a.label[lang], value: true }));
  return node;
}

function graphFor(ctx, page) {
  const { lang, key, slug } = ctx;
  const url = abs(slug);
  const title = page.title;
  const g = [];
  const img = page.ogKey ? PHOTO[page.ogKey] : PHOTO['casa-esterno-cortile'];
  const webpage = {
    '@type': key === 'galleria' ? 'CollectionPage' : key === 'contatti' ? 'ContactPage' : 'WebPage',
    '@id': `${url}#webpage`, url, name: title, inLanguage: lang, isPartOf: { '@id': `${ORIGIN}/#website` },
    about: { '@id': key === 'casa' || key === 'galleria' ? `${ORIGIN}/#house` : `${ORIGIN}/#lodging` },
    primaryImageOfPage: { '@type': 'ImageObject', url: abs(`images/${img.key}.jpg`), width: img.w, height: img.h },
  };
  if (key !== 'home') webpage.breadcrumb = { '@id': `${url}#breadcrumb` };
  if (key === 'home') {
    g.push({ '@type': 'WebSite', '@id': `${ORIGIN}/#website`, url: `${ORIGIN}/`, name: SITE.name, alternateName: SITE.alternateName, inLanguage: ['it', 'en'], publisher: { '@id': `${ORIGIN}/#lodging` } });
    g.push(lodgingNode(lang), houseNode(lang));
  } else if (key === 'contatti') {
    g.push(lodgingNode(lang));
  } else if (key === 'prezzi') {
    g.push(lodgingNode(lang, { full: hasPrices, withOffers: true }));
  } else if (key === 'casa') {
    g.push(houseNode(lang, true));
  }
  if (key === 'galleria') {
    webpage.image = PHOTOS.map(p => ({ '@type': 'ImageObject', contentUrl: abs(`images/${p.key}.jpg`), caption: p.caption[lang], width: p.w, height: p.h }));
  }
  if (key === 'dintorni') {
    webpage.mentions = [
      { '@type': 'Beach', name: 'Spiaggia di Mezzavalle' }, { '@type': 'Place', name: 'Scoglio del Trave' }, { '@type': 'Place', name: 'Portonovo' },
      { '@type': 'Park', name: 'Parco del Conero' }, { '@type': 'TrainStation', name: 'Stazione di Ancona' }, { '@type': 'Airport', name: 'Aeroporto di Ancona', iataCode: 'AOI' },
    ];
  }
  g.push(webpage);
  if (page.faqSchema) g.push(page.faqSchema);
  if (key !== 'home') {
    g.push({
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: abs(PAGES.home[lang]) },
        { '@type': 'ListItem', position: 2, name: COPY[lang].common.nav[key] || page.h1, item: url },
      ],
    });
  }
  return { '@context': 'https://schema.org', '@graph': g };
}

// ---------------------------------------------------------------------------
// Pagine
// ---------------------------------------------------------------------------

const content = {};

content.home = ctx => {
  const { C, lang } = ctx;
  const H = C.pages.home;
  const faq = faqBlock(ctx, 'home');
  const slides = HERO_SLIDES.map(k => PHOTO[k]);
  const slideAttrs = (p, i) => `role="group" aria-roledescription="slide" aria-label="${fill(C.hero.slide, { n: i + 1, total: slides.length })}" data-caption="${esc(p.caption[lang])}" data-bd="${backdrop(p.key) || ''}" data-veil="${p.veil}" data-tav="${pad2(p.tav)}"`;
  const slideHtml = (p, i) => `<div class="slide${i === 0 ? ' is-active' : ''}" ${slideAttrs(p, i)}>${pic(ctx, p.key, { eager: i === 0, sizes: SIZES.hero, focal: p.focal })}</div>`;
  const first = slides[0];
  const hero = `<section class="hero" aria-roledescription="carousel" aria-label="${C.hero.label}">
    <div class="hero-bd" aria-hidden="true">
      <div class="bd is-on" style="--bd:url(${backdrop(first.key)});--veil:${first.veil}"></div><div class="bd"></div>
    </div>
    <div class="wrap hero-grid">
      <div class="hero-text">
        <p class="eyebrow eyebrow-sabbia">${H.eyebrow}</p>
        <h1 class="display">${H.h1}</h1>
        <p class="lead lead-dark">${H.lead}</p>
        <div class="hero-actions">
          <a class="btn btn-light" href="#booking" data-cta="hero">${C.common.check}${ctx.i('arrow')}</a>
          <a class="link-arrow link-dark" href="${ctx.P('casa')}">${H.discover}${ctx.i('arrow')}</a>
        </div>
      </div>
      <div class="hero-stage">
        <div class="hero-plate" id="hero-slides">
          ${slideHtml(first, 0)}
          ${slides.slice(1).map((p, i) => `<template class="slide-tpl">${slideHtml(p, i + 1)}</template>`).join('\n          ')}
        </div>
        <div class="hero-controls">
          <p class="hero-caption"><span class="tav">${C.common.photoPlate} ${pad2(first.tav)}</span> <span class="hero-caption-text">${first.caption[lang]}</span></p>
          <div class="hero-ctrl">
            <span class="hero-count"><span class="hero-cur">01</span> / ${pad2(slides.length)}</span>
            <span class="hero-progress" aria-hidden="true"><span></span></span>
            <button class="icon-btn icon-btn-dark hero-prev" type="button" aria-label="${C.hero.prev}">${ctx.i('left')}</button>
            <button class="icon-btn icon-btn-dark hero-next" type="button" aria-label="${C.hero.next}">${ctx.i('right')}</button>
            <button class="icon-btn icon-btn-dark hero-pause" type="button" aria-pressed="false" aria-label="${C.hero.pause}" data-label-play="${C.hero.play}" data-label-pause="${C.hero.pause}">${ctx.i('pause')}${ctx.i('play', 'i-play')}</button>
          </div>
        </div>
        <p class="sr-only hero-live" aria-live="off"></p>
      </div>
    </div>
  </section>`;

  const introText2 = fill(H.intro.text2, {
    mezzavalle: `<a href="${ctx.P('dintorni', '#mezzavalle')}">Mezzavalle</a>`,
    portonovo: `<a href="${ctx.P('dintorni', '#portonovo')}">Portonovo</a>`,
  });

  return {
    title: H.title, desc: H.desc, h1: H.h1, ogImage: 'og-home', ogAlt: PHOTO['casa-esterno-cortile'].alt[lang],
    preload: { key: first.key, sizes: SIZES.hero },
    faqSchema: faq.schema,
    hero,
    body: `
  <div class="wrap booking-slot">${bookingBar(ctx, { variant: 'slab' })}</div>

  <div class="wrap facts-slot">${factsStrip(ctx)}</div>

  <section class="section">
    <div class="wrap spread">
      <div class="spread-text reveal">
        ${sectionHead(ctx, 1, H.intro.eyebrow, H.intro.h2)}
        <p class="lead">${H.intro.text}</p>
        <p>${introText2}</p>
      </div>
      <div class="spread-plate reveal">${plate(ctx, 'vista-dalla-finestra', { ratio: '1 / 1', focal: '50% 10%', sizes: SIZES.portrait })}</div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap">
      ${sectionHead(ctx, 2, H.spaces.eyebrow, H.spaces.h2, { link: linkArrow(ctx, ctx.P('casa'), H.spaces.link) })}
      <div class="trio">
        ${H.spaces.items.map(([k, h, p], i) => `<article class="trio-item reveal" style="--d:${i}">
          ${plate(ctx, k, { ratio: '4 / 5', sizes: SIZES.portrait })}
          <h3>${h}</h3><p>${p}</p>
        </article>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap spread spread-rev">
      <div class="spread-plate reveal">${plate(ctx, 'tramonto-giardino', { sizes: SIZES.portrait })}</div>
      <div class="spread-text reveal">
        ${sectionHead(ctx, 3, H.garden.eyebrow, H.garden.h2)}
        <p class="lead">${H.garden.text}</p>
        <ul class="checklist">${AMENITIES.filter(a => ['garden', 'view', 'parking', 'pets'].includes(a.key)).map(a => `<li>${ctx.i(a.icon)}${a.label[lang]}, ${a.note[lang]}</li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="horizon">
    ${backdrop('spiaggia-mezzavalle-conero') ? `<div class="bd bd-light is-on" aria-hidden="true" style="--bd:url(${backdrop('spiaggia-mezzavalle-conero')})"></div>` : ''}
    <div class="wrap">
      ${sectionHead(ctx, 4, H.horizon.eyebrow, H.horizon.h2, { link: linkArrow(ctx, ctx.P('dintorni'), H.horizon.link) })}
      ${plate(ctx, 'spiaggia-mezzavalle-conero', { sizes: SIZES.band, cls: 'plate-band' })}
      <div class="horizon-tt">${timetable(ctx, 3)}</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${sectionHead(ctx, 5, H.rates.eyebrow, H.rates.h2, { lead: H.rates.note })}
      ${ratesBlock(ctx, { compact: true })}
      <div class="btn-row">
        <a class="btn btn-secondary" href="${ctx.P('prezzi')}" data-cta="home_rates">${H.rates.see}</a>
        <a class="btn btn-primary" href="${ctx.P('contatti', '#richiesta')}" data-cta="home_quote">${H.rates.quote}${ctx.i('arrow')}</a>
      </div>
    </div>
  </section>

  ${directBand(ctx)}
  ${trustStrip(ctx)}

  <section class="section">
    <div class="wrap">
      ${sectionHead(ctx, 6, H.amenities.eyebrow, H.amenities.h2, { link: linkArrow(ctx, ctx.P('casa', '#servizi'), H.amenities.link) })}
      ${amenityRows(ctx, AMENITIES.filter(a => a.home))}
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap narrow">
      ${sectionHead(ctx, 7, H.faq.eyebrow, H.faq.h2)}
      ${faq.html}
    </div>
  </section>`,
  };
};

content.casa = ctx => {
  const { C, lang } = ctx;
  const H = C.pages.casa;
  const groups = ['dentro', 'fuori', 'regole', 'no'];
  const spaceRow = (s, i) => {
    let media = '';
    if (s.triptych) {
      media = `<figure class="triptych">${s.photos.map(k => `<div class="plate-frame" style="aspect-ratio:${PHOTO[k].w} / ${PHOTO[k].h}">${pic(ctx, k, { sizes: SIZES.narrow })}</div>`).join('')}<figcaption><span class="tav">${C.common.photoPlate} ${pad2(PHOTO[s.photos[0]].tav)}-${pad2(PHOTO[s.photos[2]].tav)}</span> ${s.triptych}</figcaption></figure>`;
    } else if (s.photos.length) {
      const [main, ...rest] = s.photos;
      media = `<div class="room-media">${plate(ctx, main, { sizes: PHOTO[main].w > PHOTO[main].h ? SIZES.landscape : SIZES.portrait })}${rest.map(k => plate(ctx, k, { cls: PHOTO[k].role === 'detail' ? 'plate-detail' : 'plate-small', cap: PHOTO[k].role === 'detail' ? 480 : 240, sizes: PHOTO[k].role === 'detail' ? SIZES.detail : '240px' })).join('')}</div>`;
    }
    return `<article class="room${i % 2 ? ' room-rev' : ''}${s.photos.length ? '' : ' room-text'} reveal" id="spazio-${s.n}">
        <div class="room-copy">
          <p class="room-n">${s.n}</p>
          <h3>${s.h}</h3>
          <p>${s.p}</p>
          <ul class="room-facts">${s.facts.map(f => `<li>${f}</li>`).join('')}</ul>
        </div>
        ${media}
      </article>`;
  };
  return {
    title: H.title, desc: H.desc, h1: H.h1, ogImage: 'og-casa', ogAlt: PHOTO['camera-matrimoniale'].alt[lang], ogKey: 'camera-matrimoniale',
    preload: { key: 'casa-esterno-cortile', sizes: SIZES.landscape },
    hero: cartouche(ctx, { plateKey: 'casa-esterno-cortile' }),
    body: `
  <section class="section">
    <div class="wrap spec">
      ${sectionHead(ctx, 1, H.spec.eyebrow, H.spec.h2)}
      <dl class="specsheet">${H.spec.rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap">
      ${sectionHead(ctx, 2, H.spaces.eyebrow, H.spaces.h2)}
      <div class="rooms">${H.spaces.items.map(spaceRow).join('\n      ')}</div>
      <p class="center-row">${linkArrow(ctx, ctx.P('prezzi'), H.spaces.toRates)}</p>
    </div>
  </section>

  <section class="section" id="servizi">
    <div class="wrap">
      ${sectionHead(ctx, 3, H.amenities.eyebrow, H.amenities.h2)}
      <div class="amen-groups">
        ${groups.map(g => `<div class="amen-group${g === 'no' ? ' is-no' : ''}"><p class="h3">${H.amenities.groups[g]}</p>${amenityRows(ctx, AMENITIES.filter(a => a.group === g))}</div>`).join('\n        ')}
      </div>
    </div>
  </section>

  ${directBand(ctx)}

  <section class="section section-tight">
    <div class="wrap">${bookingBar(ctx, { variant: 'compact' })}</div>
  </section>`,
  };
};

content.galleria = ctx => {
  const { C, lang } = ctx;
  const H = C.pages.galleria;
  const G = C.gallery;
  const rooms = ['all', 'interni', 'camere', 'bagni', 'esterni', 'dintorni'];
  const order = ['tramonto-giardino', 'soggiorno-camino', 'vista-dalla-finestra', 'camera-matrimoniale', 'giardino-palma-mare', 'soggiorno-travi', 'casa-esterno-cortile',
    'camera-doppia', 'giardino-vista-conero', 'cucina', 'camera-matrimoniale-armadio', 'bagno-vasca', 'spiaggia-mezzavalle-conero', 'camera-doppia-armadio', 'bagno-doccia', 'parcheggio-privato', 'bagno-secondo'];
  const tiles = order.map(k => {
    const p = PHOTO[k];
    const r = (p.w / p.h).toFixed(3);
    const thumb = p.w > 640 ? `images/${k}-640.webp` : `images/${k}.webp`;
    return `<li class="tile" data-room="${p.room}" style="--ar:${r}">
          <button type="button" class="tile-btn" data-full="${ctx.r(`images/${k}.jpg`)}" data-webp="${ctx.r(`images/${k}.webp`)}" data-w="${p.w}" data-h="${p.h}" data-tav="${pad2(p.tav)}" data-alt="${esc(p.alt[lang])}" aria-label="${esc(`${G.open}: ${p.caption[lang]}`)}">
            <img src="${ctx.r(thumb)}" width="${Math.min(640, p.w)}" height="${Math.round(p.h * Math.min(640, p.w) / p.w)}" alt="" loading="lazy" decoding="async" style="object-position:${p.focal}">
          </button>
          <p class="tile-cap"><span class="tav">${C.common.photoPlate} ${pad2(p.tav)}</span> ${p.caption[lang]}</p>
        </li>`;
  }).join('\n        ');
  return {
    title: H.title, desc: H.desc, h1: H.h1, ogImage: 'og-home', ogAlt: PHOTO['casa-esterno-cortile'].alt[lang],
    hero: cartouche(ctx),
    lightbox: true,
    body: `
  <section class="section">
    <div class="wrap">
      <p class="lead gallery-intro">${H.intro}</p>
      <div class="gal-bar">
        <div class="gal-filters" role="toolbar" aria-label="${G.filterLabel}">
          ${rooms.map(r => `<button type="button" data-filter="${r}" aria-pressed="${r === 'all'}">${G.filters[r]}</button>`).join('')}
        </div>
        <p class="gal-count" aria-live="polite" data-tpl="${G.count}">${fill(G.count, { n: PHOTOS.length })}</p>
      </div>
      <ul class="sheet">
        ${tiles}
      </ul>
    </div>
  </section>

  <section class="section section-alt section-tight">
    <div class="wrap">
      <p class="h3 inline-cta">${H.inline}</p>
      ${bookingBar(ctx, { variant: 'compact' })}
    </div>
  </section>`,
  };
};

content.dintorni = ctx => {
  const { C, lang } = ctx;
  const H = C.pages.dintorni;
  const tips = SITE.hostTips[lang] || [];
  return {
    title: H.title, desc: H.desc, h1: H.h1, ogImage: 'og-dintorni', ogAlt: PHOTO['spiaggia-mezzavalle-conero'].alt[lang], ogKey: 'spiaggia-mezzavalle-conero',
    preload: { key: 'spiaggia-mezzavalle-conero', sizes: SIZES.band },
    hero: cartouche(ctx, { plateKey: 'spiaggia-mezzavalle-conero', plateOpts: { cls: 'plate-band' } }),
    body: `
  <section class="section">
    <div class="wrap spread">
      <div class="spread-text">
        ${sectionHead(ctx, 1, H.distances.eyebrow, H.distances.h2)}
        ${timetable(ctx)}
        <p class="small">${C.distancesNote}</p>
      </div>
      <div class="spread-plate">${plate(ctx, 'giardino-vista-conero', { sizes: SIZES.portrait })}</div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap">
      ${sectionHead(ctx, 2, H.places.eyebrow, H.places.h2)}
      <div class="places">
        ${PLACES.filter(p => p.heading).map(p => `<article class="place reveal" id="${p.id}">
          <h3>${p.heading[lang]}</h3>
          <p>${p.description[lang]}</p>
          <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name.it + ', Ancona')}" target="_blank" rel="noopener">${C.common.directions}${ctx.i('arrow')}</a>
        </article>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section" id="come-arrivare">
    <div class="wrap">
      ${sectionHead(ctx, 3, H.arrive.eyebrow, H.arrive.h2)}
      <dl class="arrive">
        ${[['car', H.arrive.car], ['train', H.arrive.train], ['plane', H.arrive.plane]].map(([ic, [t, d]]) => `<div>${ctx.i(ic)}<dt>${t}</dt><dd>${d}</dd></div>`).join('')}
      </dl>
    </div>
  </section>

  <section class="section section-alt" id="mappa">
    <div class="wrap">
      ${sectionHead(ctx, 4, H.map.eyebrow, H.map.h2)}
      ${mapBlock(ctx)}
    </div>
  </section>

  ${tips.length ? `<section class="section"><div class="wrap narrow">${sectionHead(ctx, 5, H.tips.eyebrow, H.tips.h2)}<ul class="checklist">${tips.map(t => `<li>${ctx.i('check')}${t}</li>`).join('')}</ul></div></section>` : ''}`,
  };
};

content.prezzi = ctx => {
  const { C, lang } = ctx;
  const H = C.pages.prezzi;
  const R = C.rates;
  const faq = faqBlock(ctx, 'prezzi');
  const heroActions = `<div class="hero-actions">
        <a class="btn btn-light" href="#richiesta" data-cta="rates_hero">${C.common.request}${ctx.i('arrow')}</a>
        ${SITE.whatsapp ? `<a class="btn btn-ghost" href="${waHref(lang)}" target="_blank" rel="noopener" data-cta="whatsapp">${ctx.i('whatsapp')}WhatsApp</a>` : ''}
      </div>`;
  const tiles = [
    `<a class="qtile" href="#richiesta" data-cta="quote_mail">${ctx.i('mail')}<span class="qtile-t">${H.quote.tiles[0][0]}</span><span class="qtile-d">${H.quote.tiles[0][1]}</span></a>`,
    SITE.phone ? `<a class="qtile" href="tel:${SITE.phone.e164}" data-cta="quote_call">${ctx.i('phone')}<span class="qtile-t">${H.quote.tiles[1][0]}</span><span class="qtile-d">${SITE.phone.display}</span></a>` : '',
    SITE.whatsapp ? `<a class="qtile" href="${waHref(lang)}" target="_blank" rel="noopener" data-cta="quote_whatsapp" data-wa="${SITE.whatsapp}" data-wa-text="${esc(C.common.whatsappDates)}">${ctx.i('whatsapp')}<span class="qtile-t">${H.quote.tiles[2][0]}</span><span class="qtile-d">${H.quote.tiles[2][1]}</span></a>` : '',
  ].filter(Boolean);
  return {
    title: H.title, desc: hasPrices ? fill(H.descPrices, { price: money(lang, fromPrice) }) : H.desc, h1: H.h1, ogImage: 'og-casa', ogAlt: PHOTO['camera-matrimoniale'].alt[lang], ogKey: 'camera-matrimoniale',
    preload: { key: 'camera-matrimoniale', sizes: SIZES.landscape },
    faqSchema: faq.schema,
    hero: cartouche(ctx, { plateKey: 'camera-matrimoniale', plateOpts: { actions: heroActions } }),
    ratesData: hasPrices,
    body: `
  <div class="wrap facts-slot facts-slot-plain">${factsStrip(ctx)}</div>

  <section class="section" id="stagioni">
    <div class="wrap">
      ${sectionHead(ctx, 1, H.seasons.eyebrow, H.seasons.h2, { lead: H.seasons.intro })}
      <div class="rates-layout">
        <div class="rates-main">${ratesBlock(ctx)}</div>
        <aside class="rates-summary" aria-label="${R.summaryWhole}">
          <p class="sum-price">${hasPrices ? fill(R.summaryFrom, { price: money(lang, fromPrice) }) : R.summaryOnRequest}</p>
          <p class="sum-whole">${R.summaryWhole}</p>
          <a class="btn btn-primary btn-block" href="#richiesta" data-cta="rates_summary">${C.common.request}${ctx.i('arrow')}</a>
          <div class="sum-alt">
            ${SITE.whatsapp ? `<a class="btn btn-secondary" href="${waHref(lang)}" target="_blank" rel="noopener" data-cta="whatsapp">${ctx.i('whatsapp')}WhatsApp</a>` : ''}
            ${SITE.phone ? `<a class="btn btn-secondary" href="tel:${SITE.phone.e164}" data-cta="call">${ctx.i('phone')}${C.common.call}</a>` : ''}
          </div>
          <p class="small">${R.summaryMicro}</p>
          ${estimator(ctx)}
        </aside>
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap">
      ${sectionHead(ctx, 2, H.included.eyebrow, H.included.h2)}
      ${includedBlock(ctx)}
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${sectionHead(ctx, 3, H.how.eyebrow, H.how.h2)}
      <ol class="steps">${H.how.steps.map(([t, d], i) => `<li class="reveal" style="--d:${i}"><span class="step-n">${pad2(i + 1)}</span><p class="h3">${t}</p><p>${d}</p></li>`).join('')}</ol>
      <p class="steps-confirm">${ctx.i('shield')}${H.how.confirm}</p>
    </div>
  </section>

  ${directBand(ctx)}

  <section class="section" id="preventivo">
    <div class="wrap">
      ${sectionHead(ctx, 4, H.quote.eyebrow, H.quote.h2)}
      <div class="qtiles">${tiles.join('\n        ')}</div>
      <div class="form-slot">${requestForm(ctx)}</div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap narrow">
      ${sectionHead(ctx, 5, H.faq.eyebrow, H.faq.h2)}
      ${faq.html}
      ${SITE.bookingUrl ? `<p class="portal small">${H.portal} <a href="${SITE.bookingUrl[lang]}" rel="nofollow noopener" target="_blank">Booking.com</a>.</p>` : ''}
    </div>
  </section>`,
  };
};

content.contatti = ctx => {
  const { C, lang } = ctx;
  const H = C.pages.contatti;
  const channels = [SITE.phone && H.channels.phone, SITE.whatsapp && H.channels.whatsapp, SITE.email && H.channels.email].filter(Boolean);
  const chText = channels.length ? channels.join(', ').replace(/^./, c => c.toUpperCase()) : (lang === 'it' ? 'Contatti' : 'Contact');
  const nf = new Intl.NumberFormat(C.locale, { maximumFractionDigits: 1 });
  return {
    title: H.title, desc: fill(H.desc, { address: SITE.address.display, channels: chText }), h1: H.h1, ogImage: 'og-home', ogAlt: PHOTO['casa-esterno-cortile'].alt[lang],
    hero: cartouche(ctx),
    body: `
  <section class="section">
    <div class="wrap contact-grid">
      <div class="contact-form">${requestForm(ctx)}</div>
      <aside class="contact-card">
        <p class="h3">${H.card.title}</p>
        <div class="contact-rows">${contactLinks(ctx, { cls: 'crow', labels: true })}</div>
        ${SITE.responseTime ? `<p>${fill(C.footer.response, { t: SITE.responseTime[lang] })}</p>` : ''}
        <dl class="know">
          <div><dt>${H.card.address}</dt><dd>${SITE.address.display}</dd></div>
          <div><dt>${H.card.times}</dt><dd>${C.footer.times}</dd></div>
          <div><dt>${H.card.langs}</dt><dd>${H.card.langsText}</dd></div>
          ${SITE.cin ? `<div><dt>${H.card.cin}</dt><dd>${SITE.cin}</dd></div>` : ''}
        </dl>
      </aside>
    </div>
  </section>

  ${trustStrip(ctx)}

  <section class="section" id="mappa">
    <div class="wrap spread">
      <div class="spread-text">
        ${sectionHead(ctx, 1, H.map.eyebrow, H.map.h2)}
        <dl class="know">
          <div><dt>${H.map.station}</dt><dd>${nf.format(6.6)} km</dd></div>
          <div><dt>${H.map.airport}</dt><dd>19 km</dd></div>
        </dl>
        <p>${linkArrow(ctx, ctx.P('dintorni', '#come-arrivare'), H.map.more)}</p>
      </div>
      <div>${mapBlock(ctx)}</div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap spread spread-rev">
      <div class="spread-plate">${plate(ctx, 'casa-esterno-cortile', { sizes: SIZES.landscape })}</div>
      <div class="spread-text">
        ${sectionHead(ctx, 2, H.arrival.eyebrow, H.arrival.h2)}
        <p class="lead">${H.arrival.text}</p>
      </div>
    </div>
  </section>`,
  };
};

content.privacy = ctx => {
  const { C } = ctx;
  const H = C.pages.privacy;
  const L = SITE.legal;
  const vars = {
    controller: L.controllerName ? `${L.controllerName}${L.controllerAddress ? `, ${L.controllerAddress}` : ''}${L.controllerEmail || SITE.email ? `, ${L.controllerEmail || SITE.email}` : ''}` : `<em>${H.missing}</em>`,
    retention: L.retention?.[ctx.lang] || `<em>${H.missing}</em>`,
    provider: L.formProvider || `<em>${H.missing}</em>`,
  };
  return {
    title: H.title, desc: H.desc, h1: H.h1, ogImage: 'og-home', ogAlt: PHOTO['casa-esterno-cortile'].alt[ctx.lang], noindex: true,
    hero: cartouche(ctx),
    body: `
  <section class="section">
    <div class="wrap narrow prose">
      ${H.sections.map(([t, d]) => `<h2 class="h3">${t}</h2><p>${fill(d, vars)}</p>`).join('\n      ')}
      <h2 class="h3" id="cookie">${H.cookieTitle}</h2>
      <p>${H.cookie}</p>
    </div>
  </section>`,
  };
};

content.notFound = ctx => {
  const { C } = ctx;
  const H = C.pages.notFound;
  return {
    title: H.title, desc: H.lead, h1: H.h1, ogImage: 'og-home', ogAlt: '', noindex: true, noSkip: true,
    hero: `<section class="cartouche">
    <div class="wrap cartouche-in">
      <p class="eyebrow eyebrow-dark">404</p>
      <h1>${H.h1}</h1>
      <p class="lead lead-dark">${H.lead}</p>
      <div class="hero-actions">
        <a class="btn btn-light" href="${PAGES.home.it || './'}">${H.home}${ctx.i('arrow')}</a>
        <a class="btn btn-ghost" href="${PAGES.contatti.it}#richiesta">${C.common.request}</a>
      </div>
      <p class="lead-dark"><a class="link-dark" href="${PAGES.home.en}" lang="en">${H.en}</a></p>
    </div>
  </section>`,
    body: '',
  };
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function head(ctx, page) {
  const { lang, key, slug } = ctx;
  const url = abs(slug);
  const robots = PROD && !page.noindex ? 'index, follow, max-image-preview:large' : page.noindex && PROD ? 'noindex, follow' : 'noindex, nofollow';
  const k = key === 'notFound' ? 'home' : key;
  const pre = page.preload ? PHOTO[page.preload.key] : null;
  const graph = key === 'notFound' || key === 'privacy' ? null : graphFor(ctx, page);
  if (graph) JSON.parse(JSON.stringify(graph));
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${esc(page.desc)}">
  <meta name="robots" content="${robots}">
  ${key === 'notFound' ? `<base href="${BASE_PATH}">` : `<link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="it" href="${abs(PAGES[k].it)}">
  <link rel="alternate" hreflang="en" href="${abs(PAGES[k].en)}">
  <link rel="alternate" hreflang="x-default" href="${abs(PAGES[k].it)}">`}
  <link rel="preload" href="${ctx.r('fonts/newsreader-roman.woff2')}" as="font" type="font/woff2" crossorigin>
  ${pre ? `<link rel="preload" as="image" href="${ctx.r(`images/${pre.key}.webp`)}" imagesrcset="${srcset(ctx, pre)}" imagesizes="${page.preload.sizes}" fetchpriority="high">` : ''}
  <link rel="stylesheet" href="${ctx.r('css/style.css')}">
  <script>document.documentElement.className='js'</script>
  <meta name="theme-color" content="#1E2A23">
  <link rel="icon" href="${ctx.r('favicon.ico')}" sizes="48x48">
  <link rel="icon" href="${ctx.r('favicon.svg')}" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${ctx.r('apple-touch-icon.png')}">
  <link rel="manifest" href="${ctx.r('site.webmanifest')}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:locale" content="${lang === 'it' ? 'it_IT' : 'en_GB'}">
  <meta property="og:locale:alternate" content="${lang === 'it' ? 'en_GB' : 'it_IT'}">
  <meta property="og:title" content="${esc(page.title.replace(/ \| .*$/, ''))}">
  <meta property="og:description" content="${esc(page.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${abs(`images/${page.ogImage}.jpg`)}">
  <meta property="og:image:width" content="1024">
  <meta property="og:image:height" content="538">
  <meta property="og:image:alt" content="${esc(page.ogAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  ${graph ? `<script type="application/ld+json">${JSON.stringify(graph)}</script>` : ''}
</head>`;
}

function layout(lang, key) {
  const ctx = makeCtx(lang, key);
  const page = content[key](ctx);
  const C = ctx.C;
  const hdr = header(ctx);
  const tb = topbar(ctx);
  const main = `<main id="main">
  ${page.hero}
${page.body}
  ${key === 'notFound' || key === 'privacy' ? '' : ctaBand(ctx)}
</main>`;
  const ft = footer(ctx);
  const st = stickyCta(ctx);
  const lb = page.lightbox ? `<dialog class="lb" aria-label="${C.gallery.label}">
    <div class="lb-in">
      <button class="icon-btn lb-close" type="button" aria-label="${C.common.close}">${ctx.i('close')}</button>
      <figure class="lb-fig"><picture><source type="image/webp"><img alt=""></picture><figcaption><span class="lb-cap"></span> <span class="lb-count"></span></figcaption></figure>
      <button class="icon-btn lb-prev" type="button" aria-label="${C.gallery.prev}">${ctx.i('left')}</button>
      <button class="icon-btn lb-next" type="button" aria-label="${C.gallery.next}">${ctx.i('right')}</button>
    </div>
  </dialog>` : '';
  const data = page.ratesData ? `<script type="application/json" id="rates-data">${ratesData()}</script>` : '';
  // la testa per ultima, così le icone usate sono già registrate
  const h = head(ctx, page);
  return `<!DOCTYPE html>
<html lang="${lang}" class="no-js">
${h}
<body class="page-${key}">
${page.noSkip ? '' : `<a class="skip" href="#main">${C.common.skip}</a>`}
${tb}
${hdr}
${main}
${ft}
${st}
${lb}
${data}
${sprite(ctx.used)}
<script src="${ctx.r('js/main.js')}" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Scrittura
// ---------------------------------------------------------------------------

function lastmod() {
  try { return execSync('git log -1 --format=%cs -- scripts css js images', { cwd: ROOT }).toString().trim() || BUILD_DATE.toISOString().slice(0, 10); } catch { return BUILD_DATE.toISOString().slice(0, 10); }
}

const SITEMAP_IMAGES = {
  home: [...HERO_SLIDES, 'spiaggia-mezzavalle-conero'],
  casa: ['casa-esterno-cortile', 'soggiorno-travi', 'soggiorno-camino', 'cucina', 'camera-matrimoniale', 'camera-doppia', 'bagno-vasca', 'giardino-vista-conero', 'giardino-palma-mare', 'parcheggio-privato'],
  galleria: PHOTOS.map(p => p.key),
  dintorni: ['spiaggia-mezzavalle-conero', 'giardino-vista-conero'],
  prezzi: ['camera-matrimoniale'],
  contatti: ['casa-esterno-cortile'],
};

function build() {
  validate();
  checkContrast();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const written = [];
  for (const key of Object.keys(PAGES)) {
    for (const lang of ['it', 'en']) {
      const file = join(OUT, PAGES[key][lang], 'index.html');
      mkdirSync(dirname(file), { recursive: true });
      const html = layout(lang, key);
      writeFileSync(file, html);
      written.push([file, html]);
    }
  }
  const nf = layout('it', 'notFound');
  writeFileSync(join(OUT, '404.html'), nf);
  written.push([join(OUT, '404.html'), nf]);

  // asset
  for (const d of ['css', 'js', 'fonts']) cpSync(join(ROOT, d), join(OUT, d), { recursive: true });
  mkdirSync(join(OUT, 'images'), { recursive: true });
  const imgs = new Set();
  for (const p of PHOTOS) { imgs.add(`${p.key}.jpg`); imgs.add(`${p.key}.webp`); if (p.w > 640) imgs.add(`${p.key}-640.webp`); }
  for (const o of ['og-home', 'og-casa', 'og-dintorni']) imgs.add(`${o}.jpg`);
  for (const f of imgs) if (existsSync(join(ROOT, 'images', f))) cpSync(join(ROOT, 'images', f), join(OUT, 'images', f));
  for (const f of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(OUT, f));
  writeFileSync(join(OUT, 'site.webmanifest'), JSON.stringify({ name: SITE.name, short_name: SITE.name, icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }], theme_color: '#1E2A23', background_color: '#F2F1EC', display: 'browser' }));
  writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\n${PROD ? 'Allow: /' : 'Allow: /'}\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

  // sitemap (senza privacy e 404)
  const lm = lastmod();
  const sm = Object.keys(PAGES).filter(k => k !== 'privacy').flatMap(k => ['it', 'en'].map(lang => `  <url>
    <loc>${abs(PAGES[k][lang])}</loc>
    <lastmod>${k === 'prezzi' && RATES.lastUpdated ? RATES.lastUpdated : lm}</lastmod>
    <xhtml:link rel="alternate" hreflang="it" href="${abs(PAGES[k].it)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(PAGES[k].en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(PAGES[k].it)}"/>
${(SITEMAP_IMAGES[k] || []).map(i => `    <image:image><image:loc>${abs(`images/${i}.jpg`)}</image:loc></image:image>`).join('\n')}
  </url>`)).join('\n');
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sm}
</urlset>
`);

  // controlli sull'output
  for (const [file, html] of written) {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    if (/[–—]/.test(text)) errors.push(`Trattino lungo in ${file.replace(OUT, 'dist')}`);
    if (/\{\{|\[DA CONFERMARE\]/.test(html)) errors.push(`Segnaposto in ${file.replace(OUT, 'dist')}`);
    if (PROD && /000 000/.test(html)) errors.push(`Contatto segnaposto in ${file.replace(OUT, 'dist')}`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { errors.push(`JSON-LD non valido in ${file}: ${e.message}`); }
    }
    const unresolved = html.replace(/data-[a-z-]+="[^"]*"/g, '').match(/\{[a-z]+\}/g);
    if (unresolved) errors.push(`Variabili non sostituite ${[...new Set(unresolved)].join(', ')} in ${file.replace(OUT, 'dist')}`);
  }

  console.log(`Build ${ENV}${SHOW_PLACEHOLDERS ? ' (segnaposto anteprima)' : ''}: ${written.length} pagine in dist/`);
  if (warnings.length) console.warn(`\nDa completare prima del lancio (${warnings.length}):\n - ${warnings.join('\n - ')}`);
  if (errors.length) {
    console.error(`\nErrori (${errors.length}):\n - ${errors.join('\n - ')}`);
    process.exit(1);
  }
}

build();
