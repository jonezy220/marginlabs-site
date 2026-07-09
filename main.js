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

// LinkedIn Insight Tag (partner ID: 8971322)
(function () {
  window._linkedin_partner_id = '8971322';
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
  var s = document.getElementsByTagName('script')[0];
  var b = document.createElement('script');
  b.type = 'text/javascript';
  b.async = true;
  b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
  s.parentNode.insertBefore(b, s);
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

        // Brevo — tag as free guide lead — fire and forget, but emit GA4
        // event on success so list signups are countable in GA4.
        fetch('/api/brevo-subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, source: 'Free Guide Lead', utmParams: _utm }),
        }).then(function (r) {
          if (r && r.ok && typeof gtag !== 'undefined') {
            gtag('event', 'brevo_subscribed', { source: 'free_guide' });
          }
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
  wireCheckout('qsc-checkout-btn',   'qsc-checkout-error',   'qsc',   'Book a Call →');

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

          // GA4 event — the homepage consult/contact form is the primary
          // lead-intent signal from the corporate page. Mark as a key event
          // in GA4 Admin so it counts as a conversion.
          if (typeof gtag !== 'undefined') {
            gtag('event', 'consult_form_submitted', { source: 'homepage_contact_form' });
          }

          // Brevo — tag as consulting lead, fire GA4 event on Brevo success
          fetch('/api/brevo-subscribe', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, firstName: name.split(' ')[0] || '', source: 'Homepage Contact Form', utmParams: window.ML && window.ML.getUtmParams ? window.ML.getUtmParams() : undefined }),
          }).then(function (r) {
            if (r && r.ok && typeof gtag !== 'undefined') {
              gtag('event', 'brevo_subscribed', { source: 'homepage_contact_form' });
            }
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

  // ── LAB ARTICLE EMAIL CAPTURE ─────────────────────
  // Injected on Lab article pages only (not the index). Captures the
  // article traffic that previously left no trace: contact -> Brevo (list 2,
  // SOURCE "Lab Subscriber"), and fires GA4 generate_lead (a key event).
  (function () {
    var path = location.pathname.replace(/\/+$/, '');
    var isLabArticle = /^\/the-lab\/.+/.test(path) && !/\/index(\.html)?$/.test(path);
    var wrap = document.querySelector('.article-wrap');
    if (!isLabArticle || !wrap) return;

    var slug = path.split('/').pop();
    var block = document.createElement('div');
    block.style.cssText = 'max-width:720px;margin:0 auto;padding:0 24px;';
    block.innerHTML =
      '<div style="border:1px solid rgba(200,130,60,0.28);border-radius:4px;background:rgba(200,130,60,0.05);padding:28px 28px 30px;margin:8px 0 8px;">' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#C8823C;margin-bottom:10px;">The Lab</div>' +
        '<div style="font-size:19px;font-weight:600;letter-spacing:-0.02em;color:#F0EBE4;margin-bottom:8px;line-height:1.3;">Get new breakdowns like this</div>' +
        '<p style="font-size:14px;font-weight:300;color:rgba(240,235,228,0.55);line-height:1.7;margin:0 0 18px;">Operator-level thinking on embedded payments for vertical SaaS. No fluff, no sales spam, unsubscribe anytime.</p>' +
        '<form id="labCaptureForm" novalidate style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<input id="labCaptureEmail" type="email" required autocomplete="email" placeholder="you@company.com" aria-label="Email address" style="flex:1;min-width:220px;background:#0d0d0d;border:1px solid rgba(240,235,228,0.18);border-radius:2px;color:#F0EBE4;font-family:inherit;font-size:14px;padding:12px 14px;">' +
          '<button id="labCaptureBtn" type="submit" style="background:#C8823C;color:#0d0d0d;border:none;border-radius:2px;font-family:\'DM Mono\',monospace;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:12px 24px;cursor:pointer;white-space:nowrap;">Subscribe &rarr;</button>' +
        '</form>' +
        '<div id="labCaptureSuccess" style="display:none;font-size:14px;color:#C8823C;margin-top:14px;">Thanks, you are on the list. First breakdown lands soon.</div>' +
      '</div>';
    wrap.insertAdjacentElement('afterend', block);

    var form = block.querySelector('#labCaptureForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = block.querySelector('#labCaptureEmail');
      var btn = block.querySelector('#labCaptureBtn');
      var email = (input.value || '').trim();
      if (!email || email.indexOf('@') < 1) { input.focus(); return; }

      btn.disabled = true;
      btn.textContent = 'Sending…';
      var utm = window.ML && window.ML.getUtmParams ? window.ML.getUtmParams() : undefined;

      fetch('/api/brevo-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'Lab Subscriber',
          additionalListIds: [12], // "Lab Subscribers" list
          extraAttributes: { LAB_ARTICLE: slug },
          utmParams: utm
        })
      }).then(function (r) {
        block.querySelector('#labCaptureSuccess').style.display = 'block';
        form.style.display = 'none';
        if (window.ML && window.ML.saveVisitor) window.ML.saveVisitor({ email: email });
        if (typeof gtag !== 'undefined') {
          gtag('event', 'generate_lead', { source: 'lab_article', lab_article: slug });
          if (r && r.ok) gtag('event', 'brevo_subscribed', { source: 'lab_article' });
        }
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Subscribe →';
      });
    });
  })();

  // ── QSC CLICK TRACKING (GA4 key event) ────────────
  // Any Quick Start Call CTA click across the site fires qsc_click so the
  // funnel step "intent to book" is measurable. Mark as a key event in GA4.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-analytics*="consult"], [data-analytics*="qsc"]');
    if (a && typeof gtag !== 'undefined') {
      gtag('event', 'qsc_click', { link_location: location.pathname });
    }
  });

  // ── HOMEPAGE: latest Lab articles (auto-pull) ─────
  // If #lab-latest is present, fetch the Lab index and render the 3 newest
  // cards so the homepage never goes stale. Falls back to the server-rendered
  // cards already inside the container if the fetch fails.
  (function () {
    var host = document.getElementById('lab-latest');
    if (!host) return;
    fetch('/the-lab').then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var cards = Array.prototype.slice.call(doc.querySelectorAll('.lab-card')).slice(0, 3);
      if (!cards.length) return;
      var frag = document.createDocumentFragment();
      cards.forEach(function (c) {
        var link  = c.querySelector('.lab-card-link');
        var href  = link ? link.getAttribute('href') : '/the-lab/';
        var title = (c.querySelector('.lab-card-title') || {}).textContent || '';
        var desc  = (c.querySelector('.lab-card-desc')  || {}).textContent || '';
        var date  = (c.querySelector('.lab-card-date')  || {}).textContent || '';
        var a = document.createElement('a');
        a.href = href;
        a.setAttribute('data-analytics', 'lab-spotlight-' + href.split('/').pop());
        a.style.cssText = 'display:block;padding:24px;border:1px solid rgba(200,130,60,0.15);border-radius:4px;text-decoration:none;transition:border-color 0.15s;background:#111;';
        var d1 = document.createElement('div');
        d1.style.cssText = "font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#C8823C;margin-bottom:12px;";
        d1.textContent = date;
        var d2 = document.createElement('div');
        d2.style.cssText = 'font-size:17px;font-weight:500;letter-spacing:-0.015em;color:#F0EBE4;line-height:1.35;margin-bottom:10px;';
        d2.textContent = title;
        var d3 = document.createElement('div');
        d3.style.cssText = 'font-size:13px;color:rgba(240,235,228,0.55);line-height:1.6;';
        d3.textContent = desc;
        a.appendChild(d1); a.appendChild(d2); a.appendChild(d3);
        frag.appendChild(a);
      });
      host.innerHTML = '';
      host.appendChild(frag);
    }).catch(function () {});
  })();

})();
