/* Casa in Campagna: comportamenti del sito. Senza JS tutte le pagine restano leggibili e i form funzionano. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); };
  var parse = function (s) { var p = (s || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; };
  var addDays = function (s, n) { var x = parse(s); x.setDate(x.getDate() + n); return iso(x); };
  var today = iso(new Date());
  var params = new URLSearchParams(w.location.search);

  /* Header ---------------------------------------------------------------- */
  var header = $('#header');
  var solid = false;
  function onScroll() {
    var s = w.scrollY > 80;
    if (s !== solid && header) { solid = s; header.classList.toggle('is-solid', s); }
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu ----------------------------------------------------------- */
  var menu = $('#menu'), menuBtn = $('.menu-btn');
  var bgEls = function () { return $$('body > *').filter(function (el) { return el !== menu && el.tagName !== 'SCRIPT'; }); };
  function openMenu() {
    menu.hidden = false;
    d.body.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    bgEls().forEach(function (el) { el.inert = true; });
    var first = $('.menu-nav a', menu); if (first) first.focus();
  }
  function closeMenu() {
    menu.hidden = true;
    d.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    bgEls().forEach(function (el) { el.inert = false; });
    menuBtn.focus();
  }
  if (menu && menuBtn) {
    menuBtn.setAttribute('role', 'button');
    menuBtn.addEventListener('click', function (e) { e.preventDefault(); openMenu(); });
    $('.menu-close', menu).addEventListener('click', closeMenu);
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') {
        var f = $$('a, button', menu).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('href').charAt(0) === '#') closeMenu(); }); });
  }

  /* Date inputs ----------------------------------------------------------- */
  function linkDates(form) {
    var ci = $('[name="checkin"]', form), co = $('[name="checkout"]', form);
    if (!ci || !co) return;
    ci.min = today;
    co.min = addDays(today, 1);
    ci.addEventListener('change', function () {
      if (!ci.value) return;
      co.min = addDays(ci.value, 1);
      if (!co.value || co.value <= ci.value) co.value = addDays(ci.value, 1);
    });
  }
  $$('form').forEach(linkDates);
  $$('.estimator').forEach(linkDates);

  /* Request form ---------------------------------------------------------- */
  var form = $('#request-form');
  var card = $('#richiesta');
  function setField(name, value) {
    if (!form || value == null || value === '') return;
    var els = $$('[name="' + name + '"]', form);
    els.forEach(function (el) {
      if (el.type === 'radio') el.checked = el.value === value || (value === 'yes' && el.value === 'si') || (value === 'si' && el.value === 'yes');
      else el.value = value;
    });
  }
  function seasonName(id) {
    var link = $('[data-season-link="' + id + '"]');
    var row = link ? link.closest('tr') : $('tr[data-season="' + id + '"]');
    var n = row ? $('.rate-name', row) : null;
    return n ? n.textContent : '';
  }
  function applySeason(id) {
    if (!form || !id) return;
    setField('season', id);
    var name = seasonName(id);
    var msg = $('[name="message"]', form);
    var prefix = form.getAttribute('data-lang') === 'en' ? 'Season: ' : 'Stagione: ';
    if (name && msg && msg.value.indexOf(prefix) !== 0) msg.value = prefix + name + (msg.value ? '\n' + msg.value : '');
  }
  function goToForm(focusName) {
    if (!card) return;
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var f = $('[name="name"]', form);
    if (focusName && f) setTimeout(function () { f.focus({ preventScroll: true }); }, reduce ? 0 : 450);
  }
  function prefill(values) {
    ['checkin', 'checkout', 'guests', 'pets'].forEach(function (k) { if (values[k]) setField(k, values[k]); });
    var ci = form && $('[name="checkin"]', form), co = form && $('[name="checkout"]', form);
    if (ci && ci.value && co) co.min = addDays(ci.value, 1);
    if (values.season) applySeason(values.season);
  }
  if (form) {
    var fromUrl = {};
    ['checkin', 'checkout', 'guests', 'pets', 'season'].forEach(function (k) { if (params.get(k)) fromUrl[k] = params.get(k); });
    if (Object.keys(fromUrl).length) {
      prefill(fromUrl);
      if (w.location.hash === '#richiesta') setTimeout(function () { goToForm(true); }, 60);
    }

    var err = function (el, on) {
      var id = el.getAttribute('aria-describedby');
      var msg = id && d.getElementById(id);
      el.setAttribute('aria-invalid', on ? 'true' : 'false');
      if (msg) msg.hidden = !on;
    };
    var validate = function () {
      var ok = true, firstBad = null;
      ['name', 'email', 'checkin', 'checkout'].forEach(function (n) {
        var el = $('[name="' + n + '"]', form);
        var bad = !el.value.trim() || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
        if (n === 'checkout' && !bad) bad = el.value <= $('[name="checkin"]', form).value;
        err(el, bad);
        if (bad) { ok = false; firstBad = firstBad || el; }
      });
      if (firstBad) firstBad.focus();
      return ok;
    };
    $$('input, textarea', form).forEach(function (el) { el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') err(el, false); }); });

    var done = function (viaMail) {
      form.hidden = true;
      var box = $('.request-done', card);
      box.hidden = false;
      var m = $('.done-mail', box); if (m) m.hidden = !viaMail;
      box.focus();
      d.dispatchEvent(new CustomEvent('lead:submit', { detail: { via: viaMail ? 'mailto' : 'endpoint' } }));
      if (w.gtag) w.gtag('event', 'generate_lead');
    };
    var mailto = function () {
      var labels = JSON.parse(form.getAttribute('data-labels') || '{}');
      var data = new FormData(form), lines = [];
      data.forEach(function (v, k) { if (k !== 'company' && v) lines.push((labels[k] || k) + ': ' + v); });
      var subject = form.getAttribute('data-subject').replace('{checkin}', data.get('checkin')).replace('{checkout}', data.get('checkout'));
      var to = form.getAttribute('data-mailto');
      if (!to) return false;
      w.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      return true;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if ($('[name="company"]', form).value) return;
      if (!validate()) return;
      var action = form.getAttribute('action');
      if (action) {
        var btn = $('button[type="submit"]', form); btn.disabled = true;
        fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(); done(false); })
          .catch(function () { if (mailto()) done(true); })
          .then(function () { btn.disabled = false; });
      } else if (mailto()) { done(true); }
    });
  }

  /* Booking bars ---------------------------------------------------------- */
  $$('form.booking').forEach(function (bk) {
    var e = $('.booking-err', bk);
    bk.addEventListener('submit', function (ev) {
      var ci = $('[name="checkin"]', bk).value, co = $('[name="checkout"]', bk).value;
      if (ci && co && co <= ci) { ev.preventDefault(); e.hidden = false; $('[name="checkout"]', bk).setAttribute('aria-describedby', e.id); return; }
      e.hidden = true;
      if (bk.getAttribute('action') === '#richiesta' && form) {
        ev.preventDefault();
        prefill({ checkin: ci, checkout: co, guests: $('[name="guests"]', bk).value });
        goToForm(true);
      }
    });
  });

  /* Rates: season links on the same page ---------------------------------- */
  $$('[data-season-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!form) return;
      e.preventDefault();
      applySeason(a.getAttribute('data-season-link'));
      goToForm(true);
    });
  });
  $$('a[href="#richiesta"]').forEach(function (a) {
    a.addEventListener('click', function (e) { if (!card) return; e.preventDefault(); goToForm(true); });
  });

  /* WhatsApp tile with dates --------------------------------------------- */
  $$('[data-wa-text]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!form) return;
      var ci = $('[name="checkin"]', form).value, co = $('[name="checkout"]', form).value, g = $('[name="guests"]', form).value;
      if (ci && co) {
        var t = a.getAttribute('data-wa-text').replace('{checkin}', ci).replace('{checkout}', co).replace('{guests}', g);
        a.href = 'https://wa.me/' + a.getAttribute('data-wa') + '?text=' + encodeURIComponent(t);
      }
    });
  });

  /* Hero slideshow -------------------------------------------------------- */
  var stage = $('#hero-slides');
  if (stage) {
    var hero = stage.closest('.hero');
    var bds = $$('.hero-bd .bd', hero);
    var cap = $('.hero-caption-text', hero), tav = $('.hero-caption .tav', hero), cur = $('.hero-cur', hero);
    var prog = $('.hero-progress', hero), live = $('.hero-live', hero);
    var pauseBtn = $('.hero-pause', hero);
    var slides = $$('.slide', stage), idx = 0, timer = null, paused = reduce, hover = false;
    var DUR = 7000, tavPrefix = tav ? tav.textContent.replace(/\d+\s*$/, '') : '';
    var tavs = [];
    if (reduce && pauseBtn) { pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.setAttribute('aria-label', pauseBtn.getAttribute('data-label-play')); }

    function show(n, manual) {
      if (slides.length < 2) return;
      n = (n + slides.length) % slides.length;
      if (n === idx) return;
      slides[idx].classList.remove('is-active');
      slides[n].classList.add('is-active');
      var s = slides[n];
      if (cap) cap.textContent = s.getAttribute('data-caption');
      if (tav && tavs[n]) tav.textContent = tavPrefix + tavs[n];
      if (cur) cur.textContent = pad(n + 1);
      var on = bds[0].classList.contains('is-on') ? 0 : 1, off = 1 - on;
      var bd = s.getAttribute('data-bd');
      if (bd && bds.length === 2) {
        bds[off].style.setProperty('--bd', 'url(' + bd + ')');
        bds[off].style.setProperty('--veil', s.getAttribute('data-veil'));
        bds[off].classList.add('is-on'); bds[on].classList.remove('is-on');
      }
      if (live) { live.setAttribute('aria-live', manual ? 'polite' : 'off'); live.textContent = manual ? s.getAttribute('aria-label') + ': ' + s.getAttribute('data-caption') : ''; }
      idx = n;
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (prog) { prog.classList.remove('run'); void prog.offsetWidth; }
      if (paused || hover || d.hidden || slides.length < 2) return;
      if (prog) { prog.style.setProperty('--dur', DUR + 'ms'); prog.classList.add('run'); }
      timer = setTimeout(function () { show(idx + 1, false); }, DUR);
    }
    function init() {
      $$('template.slide-tpl', stage).forEach(function (t) { stage.appendChild(t.content.cloneNode(true)); t.remove(); });
      slides = $$('.slide', stage);
      tavs = [];
      // numeri di tavola dagli attributi aria delle didascalie: si ricavano dall'ordine del manifest
      slides.forEach(function (s, i) { tavs[i] = s.getAttribute('data-tav') || ''; });
      restart();
    }
    if (d.readyState === 'complete') init(); else w.addEventListener('load', init);
    $('.hero-prev', hero).addEventListener('click', function () { show(idx - 1, true); });
    $('.hero-next', hero).addEventListener('click', function () { show(idx + 1, true); });
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.setAttribute('aria-label', pauseBtn.getAttribute(paused ? 'data-label-play' : 'data-label-pause'));
      restart();
    });
    var stageWrap = $('.hero-stage', hero);
    stageWrap.addEventListener('mouseenter', function () { hover = true; restart(); });
    stageWrap.addEventListener('mouseleave', function () { hover = false; restart(); });
    stageWrap.addEventListener('focusin', function () { hover = true; restart(); });
    stageWrap.addEventListener('focusout', function () { hover = false; restart(); });
    stageWrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1, true);
      if (e.key === 'ArrowRight') show(idx + 1, true);
    });
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1), true);
      x0 = null;
    });
    d.addEventListener('visibilitychange', restart);
  }

  /* Sticky CTA ------------------------------------------------------------ */
  var sticky = $('#sticky');
  if (sticky && 'IntersectionObserver' in w) {
    sticky.hidden = false;
    var anchor = $('#booking') || $('.cartouche') || $('.hero');
    var blockers = [$('#richiesta'), $('.site-footer')].filter(Boolean);
    var past = false, blocked = new Set();
    var update = function () {
      var on = past && !blocked.size && !d.body.classList.contains('menu-open');
      sticky.classList.toggle('is-on', on);
      d.body.classList.toggle('has-sticky', on);
    };
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { past = !e.isIntersecting && e.boundingClientRect.top < 0; });
      update();
    }).observe(anchor);
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) blocked.add(e.target); else blocked.delete(e.target); });
      update();
    });
    blockers.forEach(function (b) { bo.observe(b); });
  }

  /* Gallery: filters + lightbox ------------------------------------------ */
  var sheet = $('.sheet');
  if (sheet) {
    var count = $('.gal-count');
    $$('.gal-filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter'), n = 0;
        $$('.gal-filters button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('.tile', sheet).forEach(function (t) {
          var show = f === 'all' || t.getAttribute('data-room') === f;
          t.hidden = !show; if (show) n++;
        });
        if (count) count.textContent = count.getAttribute('data-tpl').replace('{n}', n);
      });
    });
    var lb = $('dialog.lb');
    if (lb && lb.showModal) {
      var fig = $('.lb-fig', lb), img = $('img', lb), src = $('source', lb), lcap = $('.lb-cap', lb), lcount = $('.lb-count', lb);
      var items = [], at = 0, opener = null;
      var visible = function () { return $$('.tile:not([hidden]) .tile-btn', sheet); };
      var load = function (i) {
        items = visible();
        at = (i + items.length) % items.length;
        var b = items[at];
        fig.classList.add('is-loading');
        src.srcset = b.getAttribute('data-webp');
        img.onload = function () { fig.classList.remove('is-loading'); };
        img.src = b.getAttribute('data-full');
        img.alt = b.getAttribute('data-alt');
        img.style.maxWidth = 'min(92vw, ' + b.getAttribute('data-w') + 'px)';
        lcap.textContent = b.parentNode.querySelector('.tile-cap').textContent.trim();
        lcount.textContent = pad(at + 1) + ' / ' + pad(items.length);
        [at - 1, at + 1].forEach(function (j) { var nb = items[(j + items.length) % items.length]; if (nb) { var p = new Image(); p.src = nb.getAttribute('data-full'); } });
      };
      sheet.addEventListener('click', function (e) {
        var b = e.target.closest('.tile-btn'); if (!b) return;
        opener = b; load(visible().indexOf(b)); lb.showModal(); $('.lb-close', lb).focus();
      });
      $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
      $('.lb-prev', lb).addEventListener('click', function () { load(at - 1); });
      $('.lb-next', lb).addEventListener('click', function () { load(at + 1); });
      lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') load(at - 1); if (e.key === 'ArrowRight') load(at + 1); });
      lb.addEventListener('close', function () { if (opener) opener.focus(); });
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-in')) lb.close(); });
      var lx = null;
      lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) { if (lx == null) return; var dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 40) load(at + (dx < 0 ? 1 : -1)); lx = null; });
    }
  }

  /* Map: click to load --------------------------------------------------- */
  $$('.mapbox[data-src]').forEach(function (m) {
    var b = $('.map-load', m); if (!b) return;
    b.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = m.getAttribute('data-src'); f.title = m.getAttribute('data-title'); f.loading = 'lazy';
      m.appendChild(f); $('.mapbox-in', m).hidden = true;
    });
  });

  /* Promo copy ----------------------------------------------------------- */
  $$('[data-copy]').forEach(function (b) {
    if (b.classList.contains('estimator')) return;
    b.addEventListener('click', function () {
      var el = d.getElementById(b.getAttribute('data-copy')); if (!el) return;
      var live2 = b.closest('.promo').querySelector('[aria-live]');
      var ok = function () { if (live2) live2.textContent = b.getAttribute('data-done'); setTimeout(function () { if (live2) live2.textContent = ''; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(el.textContent).then(ok, function () { var r = d.createRange(); r.selectNodeContents(el); var s = w.getSelection(); s.removeAllRanges(); s.addRange(r); });
    });
  });

  /* Reveal on scroll ----------------------------------------------------- */
  var rev = $$('.reveal');
  if (rev.length && 'IntersectionObserver' in w && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } });
    }, { threshold: 0.15 });
    rev.forEach(function (el) { ro.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('is-in'); });

  /* Estimator ------------------------------------------------------------ */
  var dataEl = $('#rates-data'), est = $('#estimator');
  if (dataEl && est) {
    var R = JSON.parse(dataEl.textContent), E = JSON.parse(est.getAttribute('data-copy'));
    var lang = E.lang, nfmt = new Intl.NumberFormat(E.locale, { style: 'currency', currency: R.currency, maximumFractionDigits: 0 });
    var seasonFor = function (md) {
      var inP = function (p) { return p[0] <= p[1] ? md >= p[0] && md <= p[1] : md >= p[0] || md <= p[1]; };
      return R.seasons.filter(function (s) { return s.special && s.periods.some(inP); })[0] || R.seasons.filter(function (s) { return !s.special && s.periods.some(inP); })[0] || null;
    };
    var out = $('.est-out', est), cta = $('.est-cta', est), last = null, deb = null;
    ['checkin', 'checkout', 'guests'].forEach(function (k) { if (params.get(k)) $('[name="' + k + '"]', est).value = params.get(k); });
    var calc = function () {
      var ci = $('[name="checkin"]', est).value, co = $('[name="checkout"]', est).value, g = +$('[name="guests"]', est).value;
      out.innerHTML = ''; cta.hidden = true; last = null;
      if (!ci || !co || co <= ci) return;
      var nights = Math.round((Date.UTC.apply(null, co.split('-').map(function (v, i) { return i === 1 ? v - 1 : +v; })) - Date.UTC.apply(null, ci.split('-').map(function (v, i) { return i === 1 ? v - 1 : +v; }))) / 864e5);
      var per = {}, order = [], unknown = false, first = null;
      for (var i = 0; i < nights; i++) {
        var md = addDays(ci, i).slice(5), s = seasonFor(md);
        if (!s) { unknown = true; continue; }
        if (!first) first = s;
        if (!per[s.id]) { per[s.id] = { s: s, n: 0 }; order.push(s.id); }
        per[s.id].n++;
      }
      var total = 0, lines = [];
      order.forEach(function (id) {
        var p = per[id], s = p.s;
        if (!s.nightly) { unknown = true; lines.push([p.n + ' · ' + s.name[lang], '']); return; }
        var sub = s.weekly && p.n >= 7 ? Math.floor(p.n / 7) * s.weekly + (p.n % 7) * s.nightly : p.n * s.nightly;
        total += sub;
        lines.push([(p.n === 1 ? E.night : E.nights.replace('{n}', p.n)) + ' · ' + s.name[lang], nfmt.format(sub)]);
      });
      R.extras.forEach(function (x) { if (x.mandatory && typeof x.amount === 'number') { total += x.amount; lines.push([x.label[lang], nfmt.format(x.amount)]); } });
      var html = '<ul>' + lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('') + '</ul>';
      var minS = R.minStayRule === 'max' ? Math.max.apply(null, order.map(function (id) { return per[id].s.minNights || 0; })) : (first && first.minNights) || 0;
      if (minS && nights < minS) html += '<p class="est-note">' + E.minStay.replace('{n}', minS) + '</p>';
      if (unknown) html += '<p class="est-note">' + E.quote + '</p>';
      else html += '<p class="est-total"><span>' + E.total + '</span><strong>' + nfmt.format(total) + '</strong></p>';
      if (R.touristTax) {
        var tn = R.touristTax.maxNights ? Math.min(nights, R.touristTax.maxNights) : nights;
        html += '<p>' + E.tax.replace('{amount}', nfmt.format(R.touristTax.rate * g * tn)) + '</p>';
      }
      html += '<p class="small">' + E.micro + '</p>';
      out.innerHTML = html;
      cta.hidden = false;
      last = { checkin: ci, checkout: co, guests: String(g), nights: nights, total: unknown ? null : total, breakdown: order.map(function (id) { return per[id].n + ' ' + per[id].s.name[lang]; }), season: first ? first.id : '' };
    };
    est.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(calc, 250); });
    est.addEventListener('change', calc);
    calc();
    cta.addEventListener('click', function () {
      if (!last || !form) return;
      prefill({ checkin: last.checkin, checkout: last.checkout, guests: last.guests });
      setField('season', last.season);
      var txt = E.nights.replace('{n}', last.nights) + ': ' + last.breakdown.join(', ') + (last.total != null ? '. ' + E.total + ' ' + nfmt.format(last.total) + ', ' + E.taxExcluded : '');
      setField('estimate', txt);
      d.dispatchEvent(new CustomEvent('rates:estimate', { detail: last }));
      goToForm(true);
    });
  }
})();
