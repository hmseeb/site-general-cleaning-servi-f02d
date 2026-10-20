/* ============================================================
   General Cleaning Services — Phoenix, AZ
   Site behaviour: nav, scroll state, reveals, form handling
   Progressive enhancement only — the page works without JS.
   ============================================================ */
(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://vision.leadrai.com/api/forms/9a1573cefdb99e64b3e387ed12ff9542';
  var CONFIRM_TEXT = 'Thanks, your message was sent. We’ll be in touch shortly with your quote.';

  /* ---------- Current year in footer ---------- */
  var yearEls = document.querySelectorAll('[data-year]');
  var year = String(new Date().getFullYear());
  for (var y = 0; y < yearEls.length; y++) {
    yearEls[y].textContent = year;
  }

  /* ---------- Populate hidden _page fields with the current URL ---------- */
  function setPageFields() {
    var fields = document.querySelectorAll('[data-page-field]');
    for (var i = 0; i < fields.length; i++) {
      fields[i].value = window.location.href;
    }
  }
  setPageFields();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-stuck');
    else header.classList.remove('is-stuck');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll(
    '.service-card, .step, .testimonial, .stat, .services-footnote, .process-callout, .review-cta, .contact-details li'
  );

  if ('IntersectionObserver' in window && revealTargets.length) {
    for (var r = 0; r < revealTargets.length; r++) {
      revealTargets[r].classList.add('reveal');
      revealTargets[r].style.transitionDelay = (r % 4) * 70 + 'ms';
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (var o = 0; o < revealTargets.length; o++) io.observe(revealTargets[o]);
  }

  /* ---------- Submission confirmation (?submitted=1) ---------- */
  var banner = document.querySelector('[data-submitted-banner]');

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
  }

  function hasSubmittedParam() {
    try {
      return new URLSearchParams(window.location.search).get('submitted') === '1';
    } catch (err) {
      return /[?&]submitted=1(&|$)/.test(window.location.search);
    }
  }

  if (hasSubmittedParam()) {
    showBanner();
    var statusEls = document.querySelectorAll('[data-form-status]');
    for (var s = 0; s < statusEls.length; s++) {
      statusEls[s].hidden = false;
      statusEls[s].className = 'form-status is-success';
      statusEls[s].textContent = CONFIRM_TEXT;
    }
    // Bring the confirmation into view without re-triggering a jump on reload.
    var contact = document.getElementById('contact');
    if (contact && !window.location.hash) {
      window.setTimeout(function () {
        contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 240);
    }
  }

  /* ---------- Enhanced (fetch) form submission ---------- */
  var forms = document.querySelectorAll('[data-leadr-form]');

  function setStatus(form, message, state) {
    var el = form.querySelector('[data-form-status]');
    if (!el) return;
    el.hidden = false;
    el.className = 'form-status' + (state ? ' is-' + state : '');
    el.textContent = message;
  }

  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener('submit', function (e) {
      // No fetch support? Let the plain HTML POST happen.
      if (typeof window.fetch !== 'function' || typeof window.FormData !== 'function') return;

      if (!form.checkValidity || !form.checkValidity()) return;

      e.preventDefault();
      setPageFields();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }
      setStatus(form, 'Sending your request…', '');

      var data = new FormData(form);

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return { ok: res.ok };
            })
            .then(function (json) {
              if (!res.ok && !(json && json.ok)) throw new Error('Request failed');
              return json;
            });
        })
        .then(function () {
          form.reset();
          setPageFields();
          setStatus(form, CONFIRM_TEXT, 'success');
          if (form.classList.contains('contact-form')) showBanner();
          if (submitBtn) submitBtn.textContent = 'Request sent';
        })
        .catch(function () {
          setStatus(
            form,
            'Sorry, something went wrong sending that. Please try again in a moment.',
            'error'
          );
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
        });
    });
  });

  /* ---------- Minimum date on the preferred-date picker ---------- */
  var dateInput = document.getElementById('c-date');
  if (dateInput) {
    var today = new Date();
    var iso =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    dateInput.min = iso;
  }
})();
