(function () {
  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // Quick availability bar: copy dates and guests into the request form
  var quick = document.getElementById('quick-form');
  var request = document.getElementById('request-form');
  if (quick && request) {
    quick.addEventListener('submit', function (e) {
      e.preventDefault();
      ['checkin', 'checkout', 'guests'].forEach(function (name) {
        var from = quick.querySelector('[name="' + name + '"]');
        var to = request.querySelector('[name="' + name + '"]');
        if (from && to && from.value) to.value = from.value;
      });
      request.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var first = request.querySelector('[name="name"]');
      if (first) setTimeout(function () { first.focus(); }, 500);
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

  // Request form: submit via fetch (Netlify Forms) and show confirmation
  if (request) {
    request.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return; // plain submit fallback
      e.preventDefault();
      var btn = request.querySelector('button[type="submit"]');
      var success = document.getElementById('form-success');
      btn.disabled = true;
      fetch(request.getAttribute('action') || '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(request)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('send failed');
        request.reset();
        if (success) success.style.display = 'block';
        if (window.gtag) gtag('event', 'generate_lead', { method: 'website_form' });
      }).catch(function () {
        // Fallback: open the mail client with the same data
        var data = new FormData(request);
        var body = [];
        data.forEach(function (v, k) { if (k !== 'form-name' && k !== 'bot-field') body.push(k + ': ' + v); });
        var to = request.getAttribute('data-mailto') || '';
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(request.getAttribute('data-subject') || 'Richiesta disponibilità') + '&body=' + encodeURIComponent(body.join('\n'));
      }).finally(function () { btn.disabled = false; });
    });
  }

  // Hero slideshow
  var slides = document.querySelectorAll('.hero .slide');
  var dots = document.querySelectorAll('.hero-dots button');
  if (slides.length > 1) {
    var current = 0, timer;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function go(i) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].removeAttribute('aria-current');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].setAttribute('aria-current', 'true');
    }
    function start() { if (!reduce) timer = setInterval(function () { go(current + 1); }, 6000); }
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { clearInterval(timer); go(i); start(); });
    });
    document.addEventListener('visibilitychange', function () {
      clearInterval(timer);
      if (!document.hidden) start();
    });
    start();
  }

  // Lightbox
  var box = document.getElementById('lightbox');
  if (box) {
    var img = box.querySelector('img');
    var cap = box.querySelector('figcaption');
    var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a'));
    var index = 0;
    function show(i) {
      index = (i + links.length) % links.length;
      var a = links[index];
      img.src = a.getAttribute('href');
      img.alt = a.querySelector('img').alt;
      cap.textContent = img.alt;
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() { box.classList.remove('open'); document.body.style.overflow = ''; }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(i); });
    });
    box.querySelector('button').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
  }
})();
