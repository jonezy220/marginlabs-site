/* ═══════════════════════════════════════════════════
   Margin Labs — main.js
   Global script — MUST be included on every page.
   All site-wide concerns live here so they never need
   to be added per-page:
     · Google Analytics (G-BCFSRE0015)
     · Theme (dark mode)
     · Mobile nav
     · Form handling
   ═══════════════════════════════════════════════════ */

// Google Analytics — loaded once here for all pages
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-BCFSRE0015';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-BCFSRE0015');
  gtag('config', 'AW-18079962820');
})();

(function () {
  'use strict';

  // Dark mode only — theme toggle removed
  document.documentElement.setAttribute('data-theme', 'dark');

  // ── MOBILE NAV ────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      }
    });
  }

  // ── NAV SCROLL SHADOW ────────────────────────────
  const nav = document.querySelector('.site-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.style.boxShadow = window.scrollY > 8
        ? '0 1px 20px rgba(0,0,0,0.18)'
        : '';
    }, { passive: true });
  }

  // ── SMOOTH SCROLL ANCHORS ─────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── MARGIN MULTIPLIER GATE FORM ───────────────────
  // Submits to Formspree. Replace YOUR_MM_FORM_ID with your Formspree form ID.
  const mmForm = document.getElementById('mmGateForm');
  if (mmForm) {
    mmForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = mmForm.querySelector('.mm-btn');
      const original = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      try {
        const res = await fetch(mmForm.action, {
          method: 'POST',
          body: new FormData(mmForm),
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          mmForm.reset();
          const msg = document.getElementById('mmSuccess');
          if (msg) msg.style.display = 'block';
          btn.textContent = 'Sent ✓';
        } else {
          btn.textContent = 'Error — try again';
          btn.disabled = false;
        }
      } catch {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      }
    });
  }

  // ── FREE GUIDE FORM ───────────────────────────────
  const guideForm = document.getElementById('guideForm');
  if (guideForm) {
    guideForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn   = document.getElementById('guide-submit-btn');
      const email = guideForm.querySelector('input[type="email"]').value.trim();

      btn.disabled = true;
      btn.textContent = 'Sending\u2026';

      // Formspree submission (notifies Chris)
      fetch(guideForm.action, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      .then(function (r) { return r.json(); })
      .then(function () {
        // Show success message
        document.getElementById('guideSuccess').style.display = 'block';
        guideForm.reset();
        btn.style.display = 'none';

        // Resend — email the PDF link — fire and forget
        var _utm = window.ML && window.ML.getUtmParams ? window.ML.getUtmParams() : undefined;
        fetch('/api/send-guide', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, utmParams: _utm }),
        }).catch(function () {});

        // Brevo — tag as free guide lead — fire and forget
        fetch('/api/brevo-subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, source: 'Free Guide Lead', utmParams: _utm }),
        }).catch(function () {});

        // Save to shared ML state
        if (window.ML) window.ML.saveVisitor({ email });

        // GA4 event
        if (typeof gtag !== 'undefined') {
          gtag('event', 'guide_form_submitted', { source: 'homepage' });
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Get the Guide \u2192';
      });
    });
  }

  // ── STRIPE CHECKOUT ───────────────────────────────
  function wireCheckout(btnId, errId, product, resetLabel) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async function () {
      const errMsg = document.getElementById(errId);
      btn.textContent = 'One moment...';
      btn.disabled = true;
      if (errMsg) errMsg.style.display = 'none';
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product })
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'No URL returned');
        }
      } catch (err) {
        btn.textContent = resetLabel;
        btn.disabled = false;
        if (errMsg) errMsg.style.display = 'block';
      }
    });
  }

  wireCheckout('tier1-checkout-btn', 'tier1-checkout-error', 'tier1', 'Get the Framework →');
  wireCheckout('tier2-checkout-btn', 'tier2-checkout-error', 'tier2', 'Get the Playbook →');

  // ── CONTACT FORM ──────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('.form-submit');
      const original = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      const email = (contactForm.querySelector('input[type="email"]') || {}).value || '';
      const name  = (contactForm.querySelector('input[name="name"]')  || {}).value || '';

      try {
        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          contactForm.reset();
          const msg = document.getElementById('contactSuccess');
          if (msg) msg.style.display = 'block';
          btn.textContent = 'Sent ✓';

          // Brevo — tag as consulting lead
          fetch('/api/brevo-subscribe', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, firstName: name.split(' ')[0] || '', source: 'Homepage Contact Form', utmParams: window.ML && window.ML.getUtmParams ? window.ML.getUtmParams() : undefined }),
          }).catch(function () {});
        } else {
          btn.textContent = 'Error — try again';
          btn.disabled = false;
        }
      } catch {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      }
    });
  }

})();
