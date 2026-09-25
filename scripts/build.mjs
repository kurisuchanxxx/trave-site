// Generatore delle pagine statiche del sito (IT + EN).
// Uso: node scripts/build.mjs
// Scrive le pagine HTML nella root del repository e la sitemap.
// Non modificare a mano i file HTML generati: si modificano qui.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Dati della struttura (segnaposto da sostituire prima del lancio)
// ---------------------------------------------------------------------------

const SITE = 'https://www.casaincampagnatrave.it';
const C = {
  name: 'Casa in Campagna Trave',
  phone: '+39 000 000 0000',
  tel: '+390000000000',
  wa: '390000000000',
  email: 'info@casaincampagnatrave.it',
  street: 'Contrada Trave, 125',
  city: 'Montacuto',
  zip: '60129',
  region: 'AN',
  lat: 43.5727,
  lng: 13.5488,
  cin: '',
  maps: 'https://www.google.com/maps/dir/?api=1&destination=Contrada+Trave+125,+60129+Montacuto+AN',
  mapEmbed: 'https://www.google.com/maps?q=Contrada+Trave+125,+60129+Montacuto+AN&z=14&output=embed',
  booking: {
    it: 'https://www.booking.com/hotel/it/casa-in-campagna-trave.it.html',
    en: 'https://www.booking.com/hotel/it/casa-in-campagna-trave.en-gb.html',
  },
};

const PAGES = {
  home: { it: '', en: 'en/' },
  casa: { it: 'la-casa/', en: 'en/the-house/' },
  galleria: { it: 'galleria/', en: 'en/gallery/' },
  dintorni: { it: 'dintorni/', en: 'en/surroundings/' },
  prezzi: { it: 'prezzi/', en: 'en/rates/' },
  contatti: { it: 'contatti/', en: 'en/contact/' },
};
const NAV = ['casa', 'galleria', 'dintorni', 'prezzi', 'contatti'];
const LABELS = {
  it: { home: 'Home', casa: 'La casa', galleria: 'Galleria', dintorni: 'Dintorni', prezzi: 'Prezzi', contatti: 'Contatti' },
  en: { home: 'Home', casa: 'The house', galleria: 'Gallery', dintorni: 'Surroundings', prezzi: 'Rates', contatti: 'Contact' },
};

// Foto: chiave = nome file in images/ (senza estensione)
const IMG = {
  'spiaggia-mezzavalle-conero': [1024, 403, 'La spiaggia di Mezzavalle sul Monte Conero, a un chilometro dalla casa', 'Mezzavalle beach on Monte Conero, one kilometre from the house'],
  'casa-esterno-cortile': [1024, 768, 'Il cortile e l\'ingresso del casale al Trave, Montacuto', 'The courtyard and entrance of the farmhouse at Trave, Montacuto'],
  'tramonto-giardino': [576, 768, 'Tramonto sul giardino con il Monte Conero sullo sfondo', 'Sunset over the garden with Monte Conero behind'],
  'giardino-palma-mare': [578, 768, 'Il giardino recintato con la palma e il mare all\'orizzonte', 'The fenced garden with the palm and the sea on the horizon'],
  'giardino-vista-conero': [578, 768, 'Il giardino con vista sul Monte Conero', 'The garden looking onto Monte Conero'],
  'vista-dalla-finestra': [576, 768, 'Vista dalla finestra sul Conero e le palme del giardino', 'View from the window over the Conero and the garden palms'],
  'parcheggio-privato': [1024, 403, 'Il parcheggio privato con sbarra all\'ingresso della proprietà', 'The gated private parking at the entrance'],
  'soggiorno-camino': [576, 704, 'Il soggiorno con camino, tavolo da pranzo e divani', 'The living room with fireplace, dining table and sofas'],
  'soggiorno-travi': [576, 704, 'Il soggiorno con travi a vista e la scala', 'The living room with exposed beams and staircase'],
  'camera-matrimoniale': [1024, 768, 'La camera matrimoniale con travi a vista e aria condizionata', 'The double bedroom with exposed beams and air conditioning'],
  'camera-matrimoniale-armadio': [1024, 768, 'La camera matrimoniale con l\'armadio in legno', 'The double bedroom with the wooden wardrobe'],
  'camera-doppia': [578, 704, 'La camera con due letti singoli', 'The twin bedroom with two single beds'],
  'camera-doppia-armadio': [578, 704, 'La camera doppia con armadio', 'The twin bedroom with wardrobe'],
  'cucina': [576, 704, 'La cucina abitabile con forno e frigorifero', 'The eat-in kitchen with oven and fridge'],
  'bagno-vasca': [346, 704, 'Il bagno con vasca, bidet e lavatrice', 'The bathroom with bathtub, bidet and washing machine'],
  'bagno-doccia': [346, 704, 'Il bagno con doccia', 'The bathroom with shower'],
  'bagno-secondo': [346, 704, 'Il secondo bagno', 'The second bathroom'],
};

// ---------------------------------------------------------------------------
// Icone (tracciati in stile Lucide, licenza ISC)
// ---------------------------------------------------------------------------

const ICONS = {
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.86a10 10 0 0 1 14 0"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/>',
  parking: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  snowflake: '<path d="M2 12h20"/><path d="M12 2v20"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  washer: '<path d="M3 6h3"/><path d="M17 6h.01"/><rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5"/>',
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  tv: '<rect width="20" height="15" x="2" y="7" rx="2"/><path d="m17 2-5 5-5-5"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  tree: '<path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"/><path d="M12 19v3"/>',
  door: '<path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/>',
  wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  pin: '<path d="M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  lang: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  area: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  train: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  key: '<path d="M2.59 18.41A2 2 0 0 0 2 19.83V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.17a2 2 0 0 0 1.42-.59l.81-.81a6.5 6.5 0 1 0-4.17-4.17z"/><circle cx="16.5" cy="7.5" r=".5"/>',
};
const icon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const rel = (from, to) => ('../'.repeat(from.split('/').length - 1) + to) || './';

function pic(slug, lang, key, { eager = false, cls = '' } = {}) {
  const [w, h, it, en] = IMG[key];
  const load = eager ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<picture${cls ? ` class="${cls}"` : ''}><source srcset="${rel(slug, `images/${key}.webp`)}" type="image/webp"><img src="${rel(slug, `images/${key}.jpg`)}" alt="${lang === 'it' ? it : en}" width="${w}" height="${h}"${load}></picture>`;
}

function thumb(slug, lang, key, cls = '') {
  const [w, h, it, en] = IMG[key];
  const tw = Math.min(640, w), th = Math.round(h * tw / w);
  return `<a${cls ? ` class="${cls}"` : ''} href="${rel(slug, `images/${key}.jpg`)}"><img src="${rel(slug, `images/${key}-640.webp`)}" alt="${lang === 'it' ? it : en}" width="${tw}" height="${th}" loading="lazy"></a>`;
}

const waLink = (lang) => `https://wa.me/${C.wa}?text=${encodeURIComponent(lang === 'it'
  ? 'Buongiorno, vorrei informazioni sulla disponibilità della Casa in Campagna al Trave.'
  : 'Hello, I would like to check availability at Casa in Campagna Trave.')}`;

function sectionHead(eyebrow, title, lead = '', iconName = '') {
  return `<div class="section-head">
        ${iconName ? icon(iconName, 'icon head-icon') : ''}
        <span class="eyebrow">${eyebrow}</span>
        <h2>${title}</h2>
        ${lead ? `<p class="lead">${lead}</p>` : ''}
      </div>`;
}

// ---------------------------------------------------------------------------
// Blocchi riutilizzati
// ---------------------------------------------------------------------------

function amenities(lang, list) {
  const A = {
    wifi: ['wifi', 'WiFi gratuito', 'in tutta la casa', 'Free WiFi', 'throughout the house'],
    parking: ['parking', 'Parcheggio privato', 'gratuito, con sbarra', 'Private parking', 'free, gated'],
    ac: ['snowflake', 'Aria condizionata', 'e riscaldamento', 'Air conditioning', 'and heating'],
    pets: ['paw', 'Animali ammessi', 'senza supplemento', 'Pets welcome', 'no extra charge'],
    kitchen: ['utensils', 'Cucina completa', 'forno, microonde, frigo', 'Full kitchen', 'oven, microwave, fridge'],
    washer: ['washer', 'Lavatrice', 'e stendibiancheria', 'Washing machine', 'and drying rack'],
    linen: ['bed', 'Biancheria inclusa', 'lenzuola e asciugamani', 'Linen included', 'sheets and towels'],
    tv: ['tv', 'TV a schermo piatto', 'con canali via cavo', 'Flat-screen TV', 'with cable channels'],
    fire: ['flame', 'Camino', 'in soggiorno', 'Fireplace', 'in the living room'],
    garden: ['tree', 'Giardino', 'recintato, con vista', 'Garden', 'fenced, with a view'],
    door: ['door', 'Ingresso privato', 'alloggio indipendente', 'Private entrance', 'independent home'],
    nets: ['wind', 'Zanzariere', 'e ventilatore', 'Mosquito nets', 'and fan'],
  };
  return `<div class="amenities">
${list.map(k => { const [ic, it1, it2, en1, en2] = A[k]; return `        <div class="amenity">${icon(ic, 'icon badge-icon')}<div><strong>${lang === 'it' ? it1 : en1}</strong><span>${lang === 'it' ? it2 : en2}</span></div></div>`; }).join('\n')}
      </div>`;
}

function formCard(lang) {
  const it = lang === 'it';
  const name = it ? 'richiesta-disponibilita' : 'availability-request';
  const opts = [1, 2, 3, 4, 5, 6].map(n => `<option value="${n}"${n === 4 ? ' selected' : ''}>${n}</option>`).join('');
  return `<div class="form-card" id="prenota">
        <h3>${it ? 'Richiedi disponibilità' : 'Check availability'}</h3>
        <p class="hint">${it ? 'Nessun pagamento ora. Ti rispondiamo con disponibilità e prezzo diretto.' : 'No payment now. We reply with availability and our direct rate.'}</p>
        <form id="request-form" name="${name}" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-mailto="${C.email}" data-subject="${it ? 'Richiesta disponibilità' : 'Availability request'} ${C.name}">
          <input type="hidden" name="form-name" value="${name}">
          <p class="sr-only"><label>${it ? 'Non compilare' : 'Leave empty'}: <input name="bot-field"></label></p>
          <div class="form-grid">
            <div><label for="f-checkin">${it ? 'Arrivo' : 'Check-in'}</label><input type="date" id="f-checkin" name="checkin" required></div>
            <div><label for="f-checkout">${it ? 'Partenza' : 'Check-out'}</label><input type="date" id="f-checkout" name="checkout" required></div>
            <div><label for="f-guests">${it ? 'Ospiti' : 'Guests'}</label><select id="f-guests" name="guests">${opts}</select></div>
            <div><label for="f-pets">${it ? 'Animali' : 'Pets'}</label><select id="f-pets" name="pets"><option value="no">No</option><option value="${it ? 'si' : 'yes'}">${it ? 'Sì' : 'Yes'}</option></select></div>
            <div><label for="f-name">${it ? 'Nome e cognome' : 'Full name'}</label><input type="text" id="f-name" name="name" autocomplete="name" required></div>
            <div><label for="f-phone">${it ? 'Telefono' : 'Phone'}</label><input type="tel" id="f-phone" name="phone" autocomplete="tel"></div>
            <div class="full"><label for="f-email">Email</label><input type="email" id="f-email" name="email" autocomplete="email" required></div>
            <div class="full"><label for="f-msg">${it ? 'Messaggio (facoltativo)' : 'Message (optional)'}</label><textarea id="f-msg" name="message" placeholder="${it ? 'Orario di arrivo previsto, richieste particolari...' : 'Expected arrival time, special requests...'}"></textarea></div>
            <div class="full"><label class="check"><input type="checkbox" name="privacy" required><span>${it ? 'Acconsento al trattamento dei dati per ricevere una risposta a questa richiesta.' : 'I agree to the processing of my data to receive a reply to this request.'}</span></label></div>
            <div class="full"><button class="btn btn-primary btn-block" type="submit">${it ? 'Invia richiesta' : 'Send request'}${icon('arrow')}</button></div>
          </div>
        </form>
        <div class="form-success" id="form-success" role="status">${it ? 'Grazie! Abbiamo ricevuto la richiesta e ti rispondiamo in giornata.' : 'Thank you! We have received your request and will reply within the day.'}</div>
      </div>`;
}

function contactList(lang) {
  const it = lang === 'it';
  return `<ul class="contact-list">
          <li>${icon('phone', 'icon badge-icon')}<div><a href="tel:${C.tel}">${C.phone}</a><small>${it ? 'telefono e WhatsApp' : 'phone and WhatsApp'}</small></div></li>
          <li>${icon('mail', 'icon badge-icon')}<div><a href="mailto:${C.email}">${C.email}</a><small>${it ? 'rispondiamo in giornata' : 'we reply within the day'}</small></div></li>
          <li>${icon('pin', 'icon badge-icon')}<div><a href="${C.maps}" target="_blank" rel="noopener">${C.street}, ${C.zip} ${C.city} (${C.region})</a><small>${it ? 'apri le indicazioni stradali' : 'open directions'}</small></div></li>
        </ul>`;
}

function faq(lang) {
  const items = lang === 'it' ? [
    ['Quante persone può ospitare la casa?', 'Fino a 6 ospiti: una camera matrimoniale, una camera con due letti singoli e un divano letto in soggiorno. La casa è tutta vostra, non ci sono altri ospiti.'],
    ['Quanto dista dal mare?', 'Lo Scoglio del Trave è a 600 metri e la spiaggia di Mezzavalle a circa 1,1 km, raggiungibile a piedi dal sentiero. Portonovo è a 5 km, pochi minuti di auto.'],
    ['Sono ammessi gli animali?', 'Sì, cani e gatti sono i benvenuti senza alcun supplemento. Il giardino è recintato.'],
    ['A che ora sono check-in e check-out?', 'Check-in dalle 15:00, check-out entro le 10:00. Vi chiediamo di comunicarci l\'orario di arrivo in anticipo per accogliervi di persona.'],
    ['C\'è il parcheggio?', 'Sì, parcheggio privato gratuito all\'interno della proprietà, con sbarra, senza bisogno di prenotarlo.'],
    ['Conviene prenotare direttamente?', 'Sì. Prenotando dal sito, via WhatsApp o telefono non paghi le commissioni dei portali: la tariffa diretta è la più bassa che offriamo.'],
  ] : [
    ['How many people can the house sleep?', 'Up to 6 guests: one double bedroom, one twin bedroom and a sofa bed in the living room. The house is entirely yours, there are no other guests.'],
    ['How far is the sea?', 'The Trave rocks are 600 metres away and Mezzavalle beach about 1.1 km, reachable on foot by the path. Portonovo is 5 km, a few minutes by car.'],
    ['Are pets allowed?', 'Yes, dogs and cats are welcome at no extra charge. The garden is fenced.'],
    ['What are the check-in and check-out times?', 'Check-in from 15:00, check-out by 10:00. Please let us know your arrival time in advance so we can welcome you in person.'],
    ['Is there parking?', 'Yes, free gated private parking inside the property, no reservation needed.'],
    ['Is it cheaper to book direct?', 'Yes. Booking through the site, on WhatsApp or by phone means no platform commission: the direct rate is the lowest we offer.'],
  ];
  return {
    html: items.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n          '),
    schema: { '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  };
}

function rentalSchema(lang) {
  const it = lang === 'it';
  return {
    '@type': 'VacationRental',
    '@id': `${SITE}/#casa`,
    name: C.name,
    description: it
      ? 'Casa vacanze intera di 110 m² a Montacuto (Ancona), sul Monte Conero, a 600 m dallo Scoglio del Trave e 1,1 km dalla spiaggia di Mezzavalle. Fino a 6 ospiti, 2 camere, 2 bagni, cucina, giardino e parcheggio privato.'
      : 'Entire 110 m² holiday home in Montacuto (Ancona), on Monte Conero, 600 m from the Trave rocks and 1.1 km from Mezzavalle beach. Sleeps 6, 2 bedrooms, 2 bathrooms, kitchen, garden and private parking.',
    url: `${SITE}/${PAGES.home[lang]}`,
    image: ['spiaggia-mezzavalle-conero', 'casa-esterno-cortile', 'camera-matrimoniale', 'soggiorno-camino'].map(k => `${SITE}/images/${k}.jpg`),
    telephone: C.phone,
    email: C.email,
    address: { '@type': 'PostalAddress', streetAddress: C.street, addressLocality: C.city, addressRegion: C.region, postalCode: C.zip, addressCountry: 'IT' },
    geo: { '@type': 'GeoCoordinates', latitude: C.lat, longitude: C.lng },
    containsPlace: {
      '@type': 'Accommodation',
      name: it ? 'Casa in Campagna Trave, alloggio intero' : 'Casa in Campagna Trave, entire home',
      floorSize: { '@type': 'QuantitativeValue', value: 110, unitCode: 'MTK' },
      numberOfBedrooms: 2,
      numberOfBathroomsTotal: 2,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 6 },
      petsAllowed: true,
      amenityFeature: (it
        ? ['WiFi gratuito', 'Parcheggio privato gratuito', 'Aria condizionata', 'Cucina attrezzata', 'Lavatrice', 'Giardino', 'Camino']
        : ['Free WiFi', 'Free private parking', 'Air conditioning', 'Equipped kitchen', 'Washing machine', 'Garden', 'Fireplace'])
        .map(n => ({ '@type': 'LocationFeatureSpecification', name: n, value: true })),
    },
    checkinTime: '15:00',
    checkoutTime: '10:00',
    smokingAllowed: false,
    knowsLanguage: ['it', 'en'],
    sameAs: [C.booking[lang]],
  };
}

// ---------------------------------------------------------------------------
// Pagine
// ---------------------------------------------------------------------------

const content = {};

content.home = (lang, slug) => {
  const it = lang === 'it';
  const r = p => rel(slug, p);
  const P = k => r(PAGES[k][lang]);
  const guests = [2, 3, 4, 5, 6].map(n => `<option value="${n}"${n === 4 ? ' selected' : ''}>${n} ${it ? 'ospiti' : 'guests'}</option>`).join('');
  return {
    title: it ? 'Casa in Campagna Trave | Casa vacanze al Conero a 600 m dal mare, Ancona' : 'Casa in Campagna Trave | Holiday home on the Conero coast, 600 m from the sea',
    description: it
      ? 'Casa vacanze intera di 110 m² a Montacuto (Ancona), a 600 m dallo Scoglio del Trave e 1 km dalla spiaggia di Mezzavalle. Fino a 6 ospiti, giardino, parcheggio privato, animali ammessi. Prenota direttamente al miglior prezzo.'
      : 'Entire 110 m² holiday home in Montacuto (Ancona, Italy), 600 m from the Trave rocks and 1 km from Mezzavalle beach. Sleeps 6, garden, private parking, pets welcome. Book direct for the best rate.',
    hero: {
      slides: ['spiaggia-mezzavalle-conero', 'casa-esterno-cortile', 'tramonto-giardino', 'giardino-palma-mare', 'soggiorno-camino'],
      eyebrow: it ? 'Montacuto · Ancona · Riviera del Conero' : 'Montacuto · Ancona · Conero Riviera',
      h1: it ? 'Casa vacanze al Trave, tra la campagna e il mare del Conero' : 'A holiday home at Trave, between the countryside and the Conero sea',
      text: it ? 'Casa intera per 6 persone, a 600 metri dal mare.' : 'Entire house for 6, 600 metres from the sea.',
      actions: true,
    },
    schema: [rentalSchema(lang)],
    lightbox: true,
    body: `
  <div class="container">
    <form class="quick" action="${P('prezzi')}" method="get" aria-label="${it ? 'Verifica disponibilità' : 'Check availability'}">
      <div class="field"><label for="q-checkin">${it ? 'Arrivo' : 'Check-in'}</label><input type="date" id="q-checkin" name="checkin" required></div>
      <div class="field"><label for="q-checkout">${it ? 'Partenza' : 'Check-out'}</label><input type="date" id="q-checkout" name="checkout" required></div>
      <div class="field"><label for="q-guests">${it ? 'Ospiti' : 'Guests'}</label><select id="q-guests" name="guests">${guests}</select></div>
      <button class="btn btn-primary" type="submit">${it ? 'Verifica disponibilità' : 'Check availability'}${icon('arrow')}</button>
    </form>
  </div>

  <section class="section">
    <div class="container narrow center">
      ${sectionHead(it ? 'Benvenuti' : 'Welcome', it ? 'Una casa di campagna vera, a due passi dal mare più bello delle Marche' : 'A real country house, a short walk from the finest sea in the Marche',
        it ? 'Al Trave, nella frazione di Montacuto, la campagna arriva fino alla falesia. In cinque minuti sei in acqua a Mezzavalle o a Portonovo, in dieci nel centro di Ancona.'
           : 'At Trave, in the hamlet of Montacuto, the countryside runs all the way to the cliffs. You are in the water at Mezzavalle or Portonovo in five minutes, in the centre of Ancona in ten.', 'mountain')}
    </div>
    <div class="container">
      <div class="stats">
        <div class="stat">${icon('area', 'icon stat-icon')}<strong>110 m²</strong><span>${it ? 'casa intera, tutta per voi' : 'entire home, all yours'}</span></div>
        <div class="stat">${icon('users', 'icon stat-icon')}<strong>6 ${it ? 'ospiti' : 'guests'}</strong><span>${it ? '2 camere e divano letto' : '2 bedrooms and sofa bed'}</span></div>
        <div class="stat">${icon('waves', 'icon stat-icon')}<strong>600 m</strong><span>${it ? 'dallo Scoglio del Trave' : 'from the Trave rocks'}</span></div>
        <div class="stat">${icon('pin', 'icon stat-icon')}<strong>8,7</strong><span>${it ? 'voto alla posizione su Booking.com' : 'location score on Booking.com'}</span></div>
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <div class="tiles">
        <a class="tile" href="${P('casa')}">${pic(slug, lang, 'soggiorno-camino')}<span class="tile-label"><strong>${it ? 'La casa' : 'The house'}</strong><span>${it ? 'Camere, spazi e servizi' : 'Rooms, spaces and amenities'}${icon('arrow')}</span></span></a>
        <a class="tile" href="${P('dintorni')}">${pic(slug, lang, 'spiaggia-mezzavalle-conero')}<span class="tile-label"><strong>${it ? 'Dintorni' : 'Surroundings'}</strong><span>${it ? 'Spiagge del Conero e Ancona' : 'Conero beaches and Ancona'}${icon('arrow')}</span></span></a>
        <a class="tile" href="${P('prezzi')}">${pic(slug, lang, 'tramonto-giardino')}<span class="tile-label"><strong>${it ? 'Prezzi' : 'Rates'}</strong><span>${it ? 'Tariffe e prenotazione diretta' : 'Rates and direct booking'}${icon('arrow')}</span></span></a>
      </div>
    </div>
  </section>

  <section class="promo">
    <div class="container promo-inner">
      <div>
        <span class="eyebrow">${it ? 'Prenotazione diretta' : 'Book direct'}</span>
        <h2>${it ? 'Il prezzo migliore è qui, non sui portali' : 'The best price is here, not on the platforms'}</h2>
      </div>
      <div class="promo-box">
        <p>${it ? 'Prenotando dal sito, via WhatsApp o per telefono non paghi le commissioni di Booking e Airbnb.' : 'Book through the site, on WhatsApp or by phone and skip the Booking and Airbnb commission.'}</p>
        <a class="btn btn-light" href="${P('prezzi')}#prenota">${it ? 'Richiedi il prezzo diretto' : 'Ask for the direct rate'}${icon('arrow')}</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      ${sectionHead(it ? 'Servizi' : 'Amenities', it ? 'Tutto quello che serve per una vacanza comoda' : 'Everything you need for an easy holiday', '', '')}
      ${amenities(lang, ['wifi', 'parking', 'ac', 'pets', 'kitchen', 'garden', 'fire', 'linen'])}
      <p class="center more"><a class="link-arrow" href="${P('casa')}">${it ? 'Scopri la casa' : 'Discover the house'}${icon('arrow')}</a></p>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      ${sectionHead(it ? 'Galleria' : 'Gallery', it ? 'La casa, il giardino e il mare' : 'The house, the garden and the sea')}
      <div class="gallery">
        ${thumb(slug, lang, 'vista-dalla-finestra', 'tall')}
        ${thumb(slug, lang, 'camera-matrimoniale', 'wide')}
        ${thumb(slug, lang, 'giardino-palma-mare')}
        ${thumb(slug, lang, 'soggiorno-travi')}
        ${thumb(slug, lang, 'camera-doppia')}
        ${thumb(slug, lang, 'casa-esterno-cortile')}
      </div>
      <p class="center more"><a class="link-arrow" href="${P('galleria')}">${it ? 'Vedi tutte le foto' : 'See all photos'}${icon('arrow')}</a></p>
    </div>
  </section>`,
  };
};

content.casa = (lang, slug) => {
  const it = lang === 'it';
  const card = (key, t1, t2, e1, e2) => `<article class="card">${pic(slug, lang, key)}<div class="card-body"><h3>${it ? t1 : e1}</h3><p>${it ? t2 : e2}</p></div></article>`;
  const rule = (ic, it1, it2, en1, en2) => `<div class="rule">${icon(ic, 'icon badge-icon')}<div><strong>${it ? it1 : en1}</strong><span>${it ? it2 : en2}</span></div></div>`;
  return {
    title: it ? 'La casa | Casa in Campagna Trave, casa vacanze per 6 al Conero' : 'The house | Casa in Campagna Trave, holiday home for 6 on the Conero',
    description: it
      ? 'Casale ristrutturato di 110 m² con travi a vista: camera matrimoniale, camera doppia, divano letto, 2 bagni, cucina, soggiorno con camino e giardino recintato. Servizi e regole della casa.'
      : 'Restored 110 m² farmhouse with exposed beams: double bedroom, twin bedroom, sofa bed, 2 bathrooms, kitchen, living room with fireplace and fenced garden. Amenities and house rules.',
    hero: {
      image: 'camera-matrimoniale',
      eyebrow: it ? 'Casa intera · 110 m² · 6 ospiti' : 'Entire home · 110 m² · 6 guests',
      h1: it ? 'La casa' : 'The house',
      text: it ? 'Travi a vista, cotto e un giardino sul Conero.' : 'Exposed beams, terracotta floors and a garden facing the Conero.',
    },
    body: `
  <section class="section">
    <div class="container split">
      <div>
        <span class="eyebrow">${it ? 'Il casale' : 'The farmhouse'}</span>
        <h2>${it ? 'Tutto lo spazio di una casa, non di una stanza' : 'All the space of a house, not just a room'}</h2>
        <p class="lead">${it ? 'Un casale ristrutturato con soffitti a travi e pianelle, pavimenti in cotto e un grande soggiorno con camino.' : 'A restored farmhouse with beamed ceilings, terracotta floors and a large living room with a fireplace.'}</p>
        <p>${it ? 'Fuori c\'è un giardino recintato con vista sul Monte Conero e uno scorcio di mare tra le palme. Ingresso indipendente e parcheggio privato: è l\'alloggio giusto per una famiglia o un gruppo di amici che vogliono spazio, silenzio e la spiaggia vicina.' : 'Outside there is a fenced garden looking onto Monte Conero, with a glimpse of the sea between the palms. Private entrance and private parking: the right place for a family or a group of friends who want space, quiet and the beach close by.'}</p>
      </div>
      ${pic(slug, lang, 'casa-esterno-cortile', { cls: 'split-img' })}
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      ${sectionHead(it ? 'Camere e spazi' : 'Rooms and spaces', it ? 'Due camere, due bagni e un soggiorno per stare insieme' : 'Two bedrooms, two bathrooms and a living room for everyone')}
      <div class="grid-3">
        ${card('camera-matrimoniale', 'Camera matrimoniale', 'Ampia e luminosa, con armadio, aria condizionata e vista sul verde.', 'Double bedroom', 'Large and bright, with a wardrobe, air conditioning and a view of the greenery.')}
        ${card('camera-doppia', 'Camera doppia', 'Due letti singoli, ideale per bambini o amici. Il divano letto in soggiorno completa i 6 posti.', 'Twin bedroom', 'Two single beds, ideal for children or friends. The sofa bed in the living room brings the total to 6.')}
        ${card('soggiorno-camino', 'Soggiorno con camino', 'Grande tavolo, divani, TV e camino: il cuore della casa, per le cene lunghe e le sere fresche.', 'Living room with fireplace', 'A big table, sofas, TV and a fireplace: the heart of the house, for long dinners and cool evenings.')}
        ${card('cucina', 'Cucina abitabile', 'Piano cottura, forno, microonde, frigorifero e tutti gli utensili per cucinare come a casa.', 'Eat-in kitchen', 'Hob, oven, microwave, fridge and everything you need to cook as you would at home.')}
        ${card('bagno-vasca', 'Due bagni', 'Uno con vasca e uno con doccia, entrambi con bidet, asciugacapelli e set di cortesia.', 'Two bathrooms', 'One with a bathtub and one with a shower, both with bidet, hairdryer and toiletries.')}
        ${card('giardino-palma-mare', 'Giardino privato', 'Prato recintato, sicuro per bambini e animali, con vista sul Conero e il mare all\'orizzonte.', 'Private garden', 'A fenced lawn, safe for children and pets, looking onto the Conero with the sea on the horizon.')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      ${sectionHead(it ? 'Servizi' : 'Amenities', it ? 'Quello che trovate in casa' : 'What you will find in the house')}
      ${amenities(lang, ['wifi', 'parking', 'ac', 'pets', 'kitchen', 'washer', 'linen', 'tv', 'fire', 'garden', 'door', 'nets'])}
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      ${sectionHead(it ? 'Informazioni utili' : 'Good to know', it ? 'Regole della casa' : 'House rules')}
      <div class="rules">
        ${rule('login', 'Check-in', 'dalle 15:00', 'Check-in', 'from 15:00')}
        ${rule('logout', 'Check-out', 'entro le 10:00', 'Check-out', 'by 10:00')}
        ${rule('paw', 'Animali', 'benvenuti, gratis', 'Pets', 'welcome, free')}
        ${rule('ban', 'Fumo', 'non consentito in casa', 'Smoking', 'not allowed indoors')}
        ${rule('users', 'Bambini', 'di tutte le età', 'Children', 'of all ages')}
        ${rule('bed', 'Culle e letti extra', 'non disponibili', 'Cots and extra beds', 'not available')}
        ${rule('lang', 'Lingue', 'italiano, inglese', 'Languages', 'Italian, English')}
        ${rule('key', 'Arrivo', 'orario da comunicare', 'Arrival', 'please tell us the time')}
      </div>
    </div>
  </section>`,
  };
};

content.galleria = (lang, slug) => {
  const it = lang === 'it';
  const inside = ['soggiorno-camino', 'camera-matrimoniale', 'soggiorno-travi', 'camera-doppia', 'camera-matrimoniale-armadio', 'cucina', 'camera-doppia-armadio', 'bagno-vasca', 'bagno-doccia', 'bagno-secondo'];
  const outside = ['tramonto-giardino', 'casa-esterno-cortile', 'vista-dalla-finestra', 'giardino-palma-mare', 'spiaggia-mezzavalle-conero', 'giardino-vista-conero', 'parcheggio-privato'];
  return {
    title: it ? 'Galleria foto | Casa in Campagna Trave, Conero' : 'Photo gallery | Casa in Campagna Trave, Conero',
    description: it ? 'Foto della casa vacanze al Trave: camere, soggiorno con camino, cucina, bagni, giardino con vista sul Conero e la spiaggia di Mezzavalle.' : 'Photos of the holiday home at Trave: bedrooms, living room with fireplace, kitchen, bathrooms, garden facing the Conero and Mezzavalle beach.',
    hero: {
      image: 'vista-dalla-finestra',
      eyebrow: it ? '17 foto' : '17 photos',
      h1: it ? 'Galleria' : 'Gallery',
      text: it ? 'La casa, il giardino e il mare del Conero.' : 'The house, the garden and the Conero sea.',
    },
    lightbox: true,
    body: `
  <section class="section">
    <div class="container">
      ${sectionHead(it ? 'Esterni' : 'Outside', it ? 'Il giardino, la vista e il mare' : 'The garden, the view and the sea')}
      <div class="masonry">
        ${outside.map(k => thumb(slug, lang, k)).join('\n        ')}
      </div>
    </div>
  </section>
  <section class="section section-alt">
    <div class="container">
      ${sectionHead(it ? 'Interni' : 'Inside', it ? 'Camere, soggiorno, cucina e bagni' : 'Bedrooms, living room, kitchen and bathrooms')}
      <div class="masonry">
        ${inside.map(k => thumb(slug, lang, k)).join('\n        ')}
      </div>
    </div>
  </section>`,
  };
};

content.dintorni = (lang, slug) => {
  const it = lang === 'it';
  const place = (dist, t, d, et, ed, edist) => `<div class="place"><em>${it ? dist : (edist || dist)}</em><strong>${it ? t : et}</strong><p>${it ? d : ed}</p></div>`;
  const how = (ic, t, d, et, ed) => `<div class="how">${icon(ic, 'icon badge-icon')}<div><strong>${it ? t : et}</strong><p>${it ? d : ed}</p></div></div>`;
  return {
    title: it ? 'Dintorni | Spiagge del Conero, Portonovo e Ancona vicino a Casa in Campagna Trave' : 'Surroundings | Conero beaches, Portonovo and Ancona near Casa in Campagna Trave',
    description: it ? 'Dalla casa: Scoglio del Trave a 600 m, spiaggia di Mezzavalle a 1,1 km, Portonovo a 5 km, Ancona a 10 minuti, Sirolo e Numana a 20. Come arrivare in auto, treno e aereo.' : 'From the house: Trave rocks 600 m, Mezzavalle beach 1.1 km, Portonovo 5 km, Ancona 10 minutes, Sirolo and Numana 20. How to get here by car, train and plane.',
    hero: {
      image: 'spiaggia-mezzavalle-conero',
      eyebrow: it ? 'Parco del Conero' : 'Conero Regional Park',
      h1: it ? 'Dintorni' : 'Surroundings',
      text: it ? 'Le spiagge del Conero a piedi, Ancona in dieci minuti.' : 'The Conero beaches on foot, Ancona in ten minutes.',
    },
    body: `
  <section class="section">
    <div class="container">
      ${sectionHead(it ? 'Mare e borghi' : 'Sea and villages', it ? 'Cosa c\'è intorno alla casa' : 'What is around the house',
        it ? 'La casa è nel Parco del Conero, sul versante nord del monte. Le spiagge più selvagge della riviera sono a portata di passeggiata, quelle attrezzate a pochi minuti di auto.' : 'The house sits inside the Conero Regional Park, on the northern side of the mountain. The wildest beaches on the coast are a walk away, the equipped ones a few minutes by car.')}
      <div class="places">
        ${place('600 m', 'Scoglio del Trave', 'La lunga scogliera naturale che entra nel mare: snorkeling, tramonti e pochissima gente.', 'The Trave rocks', 'A long natural reef running into the sea: snorkelling, sunsets and very few people.')}
        ${place('1,1 km', 'Spiaggia di Mezzavalle', 'Spiaggia libera ai piedi della falesia, tra le più belle del Conero. Si raggiunge dal sentiero.', 'Mezzavalle beach', 'A free beach at the foot of the cliffs, one of the most beautiful on the Conero. Reached by footpath.', '1.1 km')}
        ${place('5 km', 'Portonovo', 'La baia con la chiesa romanica, i ristoranti di pesce e i moscioli, gli stabilimenti e il fortino napoleonico.', 'Portonovo', 'The bay with its Romanesque church, seafood restaurants and local mussels, beach clubs and the Napoleonic fort.')}
        ${place('6,6 km', 'Ancona', 'Il centro, il porto, il Passetto e il Duomo di San Ciriaco. Treni e traghetti per la Croazia.', 'Ancona', 'The old town, the harbour, the Passetto and the cathedral of San Ciriaco. Trains, and ferries to Croatia.', '6.6 km')}
        ${place('20 min', 'Sirolo e Numana', 'I borghi sul mare, le Due Sorelle in barca, le passeggiate nel Parco del Conero.', 'Sirolo and Numana', 'The villages on the sea, the Due Sorelle rocks by boat, walks in the Conero park.')}
        ${place('19 km', 'Aeroporto di Ancona', 'Falconara Marittima, circa 25 minuti di auto.', 'Ancona airport', 'Falconara Marittima, about 25 minutes by car.')}
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container split">
      <div>
        ${sectionHead(it ? 'Come arrivare' : 'Getting here', it ? 'In auto, treno o aereo' : 'By car, train or plane')}
        <div class="how-list">
          ${how('car', 'In auto', 'Autostrada A14, uscita Ancona Sud, poi direzione Ancona e Montacuto: circa 15 minuti. Parcheggio privato gratuito in casa.', 'By car', 'A14 motorway, exit Ancona Sud, then towards Ancona and Montacuto: about 15 minutes. Free private parking at the house.')}
          ${how('train', 'In treno', 'Stazione di Ancona a 6,6 km, raggiungibile in taxi in circa 15 minuti.', 'By train', 'Ancona station is 6.6 km away, about 15 minutes by taxi.')}
          ${how('plane', 'In aereo', 'Aeroporto di Ancona Falconara a 19 km. Un\'auto è consigliata per muoversi lungo la riviera.', 'By plane', 'Ancona Falconara airport is 19 km away. A car is recommended to get around the coast.')}
        </div>
        <p class="more"><a class="btn btn-outline" href="${C.maps}" target="_blank" rel="noopener">${icon('pin')}${it ? 'Indicazioni stradali' : 'Get directions'}</a></p>
      </div>
      ${pic(slug, lang, 'parcheggio-privato', { cls: 'split-img' })}
    </div>
  </section>`,
  };
};

content.prezzi = (lang, slug) => {
  const it = lang === 'it';
  const f = faq(lang);
  const season = (t, when, et, ewhen) => `<div class="season">
          <div><h3>${it ? t : et}</h3><p>${it ? when : ewhen}</p></div>
          <div class="season-price"><span>${it ? 'Tariffa diretta' : 'Direct rate'}</span><strong>${it ? 'su richiesta' : 'on request'}</strong></div>
          <div class="season-actions"><a class="btn btn-primary btn-sm" href="#prenota">${icon('mail')}${it ? 'Richiedi' : 'Request'}</a><a class="btn btn-outline btn-sm" href="tel:${C.tel}">${icon('phone')}${it ? 'Chiama' : 'Call'}</a></div>
        </div>`;
  const perk = (ic, t, d, et, ed) => `<div class="perk">${icon(ic, 'icon badge-icon')}<strong>${it ? t : et}</strong><p>${it ? d : ed}</p></div>`;
  return {
    title: it ? 'Prezzi e prenotazione diretta | Casa in Campagna Trave, Conero' : 'Rates and direct booking | Casa in Campagna Trave, Conero',
    description: it ? 'Tariffe della casa vacanze al Trave per stagione. Prenotando direttamente dal sito, via WhatsApp o telefono hai il prezzo più basso, senza commissioni dei portali.' : 'Seasonal rates for the holiday home at Trave. Book direct through the site, WhatsApp or phone for the lowest price, with no platform commission.',
    hero: {
      image: 'tramonto-giardino',
      eyebrow: it ? 'Prenotazione diretta' : 'Direct booking',
      h1: it ? 'Prezzi' : 'Rates',
      text: it ? 'Il prezzo migliore è quello diretto.' : 'The best price is the direct one.',
    },
    schema: [f.schema],
    noCtaBand: true,
    body: `
  <section class="section">
    <div class="container">
      ${sectionHead(it ? 'Perché prenotare qui' : 'Why book here', it ? 'Prenota direttamente: paghi meno e parli con chi ti ospita' : 'Book direct: pay less and talk to your host')}
      <div class="perks">
        ${perk('tag', 'Nessuna commissione', 'Sui portali il prezzo include la loro commissione. Qui paghi solo il soggiorno.', 'No commission', 'Platform prices include their commission. Here you pay only for your stay.')}
        ${perk('chat', 'Risposta personale', 'Ti risponde chi ti ospita, in giornata, per telefono, WhatsApp o email.', 'A personal reply', 'Your host replies within the day, by phone, WhatsApp or email.')}
        ${perk('calendar', 'Conferma semplice', 'Ti mandiamo disponibilità e prezzo, confermi con una caparra e il resto all\'arrivo.', 'Simple confirmation', 'We send availability and price, you confirm with a deposit and pay the balance on arrival.')}
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      ${sectionHead(it ? 'Stagioni' : 'Seasons', it ? 'Controlla le stagioni e richiedi la tariffa' : 'Check the seasons and ask for the rate', it ? 'Il prezzo è per la casa intera, fino a 6 ospiti.' : 'The price is for the entire house, up to 6 guests.')}
      <div class="seasons">
        ${season('Bassa stagione', 'Da ottobre a maggio', 'Low season', 'October to May')}
        ${season('Media stagione', 'Giugno e settembre', 'Mid season', 'June and September')}
        ${season('Alta stagione', 'Luglio e agosto', 'High season', 'July and August')}
        ${season('Ferragosto', 'Settimana di Ferragosto', 'Ferragosto', 'The week of 15 August')}
      </div>
      <div class="included">
        <h3>${it ? 'Sempre incluso' : 'Always included'}</h3>
        <ul>
          ${(it ? ['Biancheria da letto e asciugamani', 'WiFi', 'Parcheggio privato', 'Aria condizionata e riscaldamento', 'Animali senza supplemento']
                : ['Bed linen and towels', 'WiFi', 'Private parking', 'Air conditioning and heating', 'Pets at no extra charge']).map(x => `<li>${icon('check')}${x}</li>`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container direct">
      <div>
        <span class="eyebrow">${it ? 'Come funziona' : 'How it works'}</span>
        <h2>${it ? 'Tre passaggi, nessun pagamento anticipato online' : 'Three steps, no online prepayment'}</h2>
        <ol class="steps">
          <li><div><strong>${it ? 'Mandaci date e numero di ospiti' : 'Send us your dates and number of guests'}</strong><span>${it ? 'Con il modulo, su WhatsApp o per telefono.' : 'With the form, on WhatsApp or by phone.'}</span></div></li>
          <li><div><strong>${it ? 'Ricevi disponibilità e prezzo diretto' : 'Receive availability and the direct rate'}</strong><span>${it ? 'Ti rispondiamo in giornata.' : 'We reply within the day.'}</span></div></li>
          <li><div><strong>${it ? 'Confermi con una caparra' : 'Confirm with a deposit'}</strong><span>${it ? 'Il saldo all\'arrivo.' : 'The balance on arrival.'}</span></div></li>
        </ol>
        <div class="direct-alt">
          <a class="btn btn-whatsapp" href="${waLink(lang)}" target="_blank" rel="noopener">${icon('chat')}WhatsApp</a>
          <a class="btn btn-outline" href="tel:${C.tel}">${icon('phone')}${C.phone}</a>
        </div>
        <p class="small">${it ? 'Preferisci un portale? Ci trovi anche su' : 'Prefer a booking platform? You will also find us on'} <a href="${C.booking[lang]}" rel="nofollow noopener" target="_blank">Booking.com</a>.</p>
      </div>
      ${formCard(lang)}
    </div>
  </section>

  <section class="section section-alt">
    <div class="container narrow faq">
      ${sectionHead('FAQ', it ? 'Domande frequenti' : 'Frequently asked questions')}
      ${f.html}
    </div>
  </section>`,
  };
};

content.contatti = (lang, slug) => {
  const it = lang === 'it';
  return {
    title: it ? 'Contatti | Casa in Campagna Trave, Contrada Trave 125, Montacuto (Ancona)' : 'Contact | Casa in Campagna Trave, Contrada Trave 125, Montacuto (Ancona)',
    description: it ? 'Contatta Casa in Campagna Trave per disponibilità e prezzo diretto: telefono, WhatsApp, email. Contrada Trave 125, 60129 Montacuto, Ancona.' : 'Contact Casa in Campagna Trave for availability and direct rates: phone, WhatsApp, email. Contrada Trave 125, 60129 Montacuto, Ancona, Italy.',
    hero: {
      image: 'giardino-vista-conero',
      eyebrow: it ? 'Montacuto · Ancona' : 'Montacuto · Ancona',
      h1: it ? 'Contatti' : 'Contact',
      text: it ? 'Scrivici o chiamaci: rispondiamo in giornata.' : 'Write or call us: we reply within the day.',
    },
    noCtaBand: true,
    body: `
  <section class="section">
    <div class="container direct">
      <div>
        <span class="eyebrow">${it ? 'Parliamone' : 'Get in touch'}</span>
        <h2>${it ? 'Chiamaci, scrivici o mandaci un messaggio' : 'Call, write or send us a message'}</h2>
        ${contactList(lang)}
        <div class="direct-alt">
          <a class="btn btn-whatsapp" href="${waLink(lang)}" target="_blank" rel="noopener">${icon('chat')}${it ? 'Scrivici su WhatsApp' : 'Message us on WhatsApp'}</a>
        </div>
        <div class="rules compact">
          <div class="rule">${icon('login', 'icon badge-icon')}<div><strong>Check-in</strong><span>${it ? 'dalle 15:00' : 'from 15:00'}</span></div></div>
          <div class="rule">${icon('logout', 'icon badge-icon')}<div><strong>Check-out</strong><span>${it ? 'entro le 10:00' : 'by 10:00'}</span></div></div>
        </div>
      </div>
      ${formCard(lang)}
    </div>
  </section>

  <section class="map-section">
    <iframe title="${it ? 'Mappa' : 'Map'}: ${C.name}, ${C.street}, ${C.city}" src="${C.mapEmbed}${it ? '' : '&hl=en'}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
  </section>`,
  };
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function layout(lang, key) {
  const slug = PAGES[key][lang];
  const other = lang === 'it' ? 'en' : 'it';
  const it = lang === 'it';
  const r = p => rel(slug, p);
  const P = k => r(PAGES[k][lang]);
  const L = LABELS[lang];
  const page = content[key](lang, slug);
  const url = `${SITE}/${slug}`;
  const ogImage = `${SITE}/images/${page.hero.slides ? page.hero.slides[0] : page.hero.image}.jpg`;

  const graph = [...(page.schema || [])];
  if (key !== 'home') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: L.home, item: `${SITE}/${PAGES.home[lang]}` },
        { '@type': 'ListItem', position: 2, name: L[key], item: url },
      ],
    });
  }

  const slides = page.hero.slides || [page.hero.image];
  const hero = `<section class="hero${page.hero.slides ? '' : ' hero--page'}">
    <div class="slides">
      ${slides.map((k, i) => pic(slug, lang, k, { eager: i === 0, cls: `slide${i === 0 ? ' active' : ''}` })).join('\n      ')}
    </div>
    <div class="container hero-content">
      <span class="eyebrow">${page.hero.eyebrow}</span>
      <h1>${page.hero.h1}</h1>
      <p>${page.hero.text}</p>
      ${page.hero.actions ? `<div class="hero-actions">
        <a class="btn btn-primary" href="${P('prezzi')}#prenota">${it ? 'Richiedi disponibilità' : 'Check availability'}</a>
        <a class="btn btn-ghost" href="${P('galleria')}">${icon('image')}${it ? 'Guarda le foto' : 'See the photos'}</a>
      </div>` : ''}
    </div>
    ${slides.length > 1 ? `<div class="hero-dots" aria-label="${it ? 'Scegli foto' : 'Choose photo'}">${slides.map((_, i) => `<button type="button" aria-label="${it ? 'Foto' : 'Photo'} ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>` : ''}
  </section>`;

  const ctaBand = page.noCtaBand ? '' : `
  <section class="cta-band">
    <div class="container cta-inner">
      <div>
        <h2>${it ? 'Prenota direttamente al miglior prezzo' : 'Book direct for the best rate'}</h2>
        <p>${it ? 'Mandaci le date: ti rispondiamo in giornata con disponibilità e prezzo.' : 'Send us your dates: we reply within the day with availability and price.'}</p>
      </div>
      <div class="cta-actions">
        <a class="btn btn-light" href="${P('prezzi')}#prenota">${it ? 'Richiedi disponibilità' : 'Check availability'}${icon('arrow')}</a>
        <a class="btn btn-whatsapp" href="${waLink(lang)}" target="_blank" rel="noopener">${icon('chat')}WhatsApp</a>
      </div>
    </div>
  </section>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="it" href="${SITE}/${PAGES[key].it}">
  <link rel="alternate" hreflang="en" href="${SITE}/${PAGES[key].en}">
  <link rel="alternate" hreflang="x-default" href="${SITE}/${PAGES[key].it}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${it ? 'it_IT' : 'en_GB'}">
  <meta property="og:site_name" content="${C.name}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${r('favicon.svg')}" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Mulish:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="${r('css/style.css')}">
${graph.length ? `  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>\n` : ''}</head>
<body class="page-${key}">

<header class="header" id="header">
  <div class="topbar">
    <div class="container topbar-inner">
      <a href="mailto:${C.email}">${icon('mail')}${C.email}</a>
      <a href="${C.maps}" target="_blank" rel="noopener">${icon('pin')}${C.street}, ${C.city} (${C.region})</a>
      <a href="tel:${C.tel}">${icon('phone')}${C.phone}</a>
    </div>
  </div>
  <div class="container header-inner">
    <a class="brand" href="${P('home')}">Casa in Campagna<small>Trave · Conero</small></a>
    <button class="nav-toggle" type="button" aria-label="${it ? 'Apri menu' : 'Open menu'}" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
    <nav class="nav" id="nav" aria-label="${it ? 'Principale' : 'Main'}">
      ${NAV.map(k => `<a href="${P(k)}"${k === key ? ' aria-current="page"' : ''}>${L[k]}</a>`).join('\n      ')}
      <div class="lang"><a href="${r(PAGES[key].it)}" lang="it" hreflang="it"${it ? ' aria-current="true"' : ''}>IT</a><a href="${r(PAGES[key].en)}" lang="en" hreflang="en"${it ? '' : ' aria-current="true"'}>EN</a></div>
      <a class="btn btn-primary btn-sm" href="${P('prezzi')}#prenota">${it ? 'Prenota' : 'Book'}</a>
    </nav>
  </div>
</header>

<main>
  ${hero}
${page.body}
${ctaBand}
</main>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="${P('home')}">Casa in Campagna<small>Trave · Conero</small></a>
        <p>${it ? 'Casa vacanze intera per 6 persone a Montacuto, Ancona, nel Parco del Conero. A 600 m dallo Scoglio del Trave e 1 km dalla spiaggia di Mezzavalle.' : 'Entire holiday home for 6 in Montacuto, Ancona, inside the Conero Regional Park. 600 m from the Trave rocks and 1 km from Mezzavalle beach.'}</p>
        <p class="small">CIN: ${C.cin || (it ? 'da inserire' : 'to be added')}</p>
      </div>
      <div>
        <h3>${it ? 'Il sito' : 'Site'}</h3>
        <ul>
          ${['home', ...NAV].map(k => `<li><a href="${P(k)}">${L[k]}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <h3>${it ? 'Contatti' : 'Contact'}</h3>
        <ul>
          <li><a href="tel:${C.tel}">${C.phone}</a></li>
          <li><a href="mailto:${C.email}">${C.email}</a></li>
          <li>${C.street}<br>${C.zip} ${C.city}, Ancona</li>
        </ul>
      </div>
      <div>
        <h3>${it ? 'Ci trovi anche su' : 'Also on'}</h3>
        <ul>
          <li><a href="${C.booking[lang]}" rel="nofollow noopener" target="_blank">Booking.com</a></li>
          <li><a href="${r(PAGES[key][other])}" hreflang="${other}">${other === 'en' ? 'English' : 'Italiano'}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 ${C.name}</span>
      <span><a href="#">Privacy</a> · <a href="#">Cookie</a></span>
    </div>
  </div>
</footer>

<div class="mobile-cta">
  <a class="btn btn-whatsapp btn-sm" href="${waLink(lang)}" target="_blank" rel="noopener">${icon('chat')}WhatsApp</a>
  <a class="btn btn-primary btn-sm" href="${P('prezzi')}#prenota">${it ? 'Richiedi disponibilità' : 'Check availability'}</a>
</div>
${page.lightbox ? `
<figure class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="${it ? 'Foto ingrandita' : 'Enlarged photo'}">
  <button type="button" class="lb-close" aria-label="${it ? 'Chiudi' : 'Close'}">×</button>
  <button type="button" class="lb-prev" aria-label="${it ? 'Foto precedente' : 'Previous photo'}">‹</button>
  <img src="" alt="">
  <button type="button" class="lb-next" aria-label="${it ? 'Foto successiva' : 'Next photo'}">›</button>
  <figcaption></figcaption>
</figure>
` : ''}
<script src="${r('js/main.js')}" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Scrittura file
// ---------------------------------------------------------------------------

const urls = [];
for (const key of Object.keys(PAGES)) {
  for (const lang of ['it', 'en']) {
    const slug = PAGES[key][lang];
    const file = join(ROOT, slug, 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, layout(lang, key));
    urls.push({ key, lang, slug });
    console.log('scritto', slug + 'index.html');
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(({ key, slug }) => `  <url>
    <loc>${SITE}/${slug}</loc>
    <xhtml:link rel="alternate" hreflang="it" href="${SITE}/${PAGES[key].it}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/${PAGES[key].en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${PAGES[key].it}"/>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);
console.log('scritto sitemap.xml');
