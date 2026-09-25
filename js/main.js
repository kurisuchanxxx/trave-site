(function () {
  var header = document.getElementById('header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');

  // Header: transparent over the hero, solid after scrolling or with the menu open
  function updateHeader() {
    if (!header) return;
    var open = nav && nav.classList.contains('open');
    header.classList.toggle('is-solid', open || window.scrollY > 40);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Mobile navigation
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      updateHeader();
    });
  }

  // Minimum dates on date inputs
  var today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach(function (i) { i.min = today; });
  document.querySelectorAll('form').forEach(function (f) {
    var ci = f.querySelector('[name="checkin"]');
    var co = f.querySelector('[name="checkout"]');
    if (ci && co) ci.addEventListener('change', function () { co.min = ci.value || today; });
  });

  var request = document.getElementById('request-form');

  // Prefill the request form with dates sent from the home availability bar
  if (request && window.URLSearchParams) {
    var params = new URLSearchParams(window.location.search);
    var filled = false;
    ['checkin', 'checkout', 'guests'].forEach(function (name) {
      var v = params.get(name);
      var field = request.querySelector('[name="' + name + '"]');
      if (v && field) { field.value = v; filled = true; }
    });
    if (filled) {
      var card = document.getElementById('prenota');
      setTimeout(function () {
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var first = request.querySelector('[name="name"]');
        if (first) first.focus({ preventScroll: true });
      }, 300);
    }
  }

  // Request form: submit via fetch (Netlify Forms), fall back to email
  if (request) {
    request.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      var btn = request.querySelector('button[type="submit"]');
      var success = document.getElementById('form-success');
      btn.disabled = true;
      fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(request)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('send failed');
        request.reset();
        if (success) success.style.display = 'block';
        if (window.gtag) window.gtag('event', 'generate_lead', { method: 'website_form' });
      }).catch(function () {
        var data = new FormData(request);
        var body = [];
        data.forEach(function (v, k) { if (k !== 'form-name' && k !== 'bot-field') body.push(k + ': ' + v); });
        window.location.href = 'mailto:' + (request.getAttribute('data-mailto') || '') +
          '?subject=' + encodeURIComponent(request.getAttribute('data-subject') || '') +
          '&body=' + encodeURIComponent(body.join('\n'));
      }).finally(function () { btn.disabled = false; });
    });
  }

  // Hero slideshow
  var slides = document.querySelectorAll('.hero .slide');
  var dots = document.querySelectorAll('.hero-dots button');
  if (slides.length > 1) {
    var current = 0, timer;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var go = function (i) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].removeAttribute('aria-current');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].setAttribute('aria-current', 'true');
    };
    var start = function () { if (!reduce) timer = setInterval(function () { go(current + 1); }, 6000); };
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { clearInterval(timer); go(i); start(); });
    });
    document.addEventListener('visibilitychange', function () {
      clearInterval(timer);
      if (!document.hidden) start();
    });
    start();
  }

  // Lightbox for gallery grids
  var box = document.getElementById('lightbox');
  if (box) {
    var img = box.querySelector('img');
    var cap = box.querySelector('figcaption');
    var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a, .masonry a'));
    var index = 0;
    var show = function (i) {
      index = (i + links.length) % links.length;
      var a = links[index];
      img.src = a.getAttribute('href');
      img.alt = a.querySelector('img').alt;
      cap.textContent = img.alt;
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    var close = function () { box.classList.remove('open'); document.body.style.overflow = ''; };
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(i); });
    });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
  }
})();
