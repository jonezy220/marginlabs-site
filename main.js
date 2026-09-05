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

// Brevo Tracker (SDK 2.0, client_key whp6oe7w8d43k0sg0fl04emo)
// Tracks page views site-wide and binds them to a Brevo contact once
// identified (via email-link click, or the mlBrevoIdentify() helper below).
// So each contact's page journey shows on their Brevo profile.
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://cdn.brevo.com/js/sdk-loader.js';
  document.head.appendChild(s);
  window.Brevo = window.Brevo || [];
  window.Brevo.push(['init', { client_key: 'whp6oe7w8d43k0sg0fl04emo' }]);

  // Bind the current visitor's browsing to a known contact by email.
  // Called from the form/gate/purchase success handlers below.
  window.mlBrevoIdentify = function (email) {
    if (!email) return;
    var e = String(email).trim().toLowerCase();
    if (window.Brevo) window.Brevo.push(['identify', { identifiers: { email_id: e } }]);
    // Also bind the PostHog person to this email.
    if (window.posthog && window.posthog.identify) window.posthog.identify(e, { email: e });
  };
  // Log a named milestone on the contact timeline (e.g. ran_multiplier).
  window.mlBrevoTrack = function (event, email, data) {
    if (!event) return;
    if (window.Brevo) {
      var payload = ['track', event];
      if (email) payload.push({ email_id: String(email).trim().toLowerCase() });
      if (data) payload.push({ data: data });
      window.Brevo.push(payload);
    }
    // Mirror the event into PostHog for funnels/analysis.
    if (window.posthog && window.posthog.capture) window.posthog.capture(event, data || {});
  };
})();

// PostHog (product analytics: funnels, paths, session replay, heatmaps)
// Project 506337 (US). Anonymous sessions are captured + recorded; a Person
// profile is only created once identified (identified_only) to conserve quota.
(function () {
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  window.posthog.init('phc_w4aVK7k6tqdRxwnXo5VBqhnmA9daTwpxCopcyWxiXqb5', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only'
  });
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

        // Brevo — bind this visitor's browsing history to their contact.
        if (window.mlBrevoIdentify) window.mlBrevoIdentify(email);

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
  // GA4 ecommerce value per product, used for begin_checkout.
  const PRODUCT_VALUE = { tier1: 139, tier2: 697, qsc: 379 };
  const PRODUCT_NAME  = { tier1: 'Strategic Framework', tier2: 'Execution Playbook', qsc: 'Quick Start Call' };

  function wireCheckout(btnId, errId, product, resetLabel) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const originalLabel = btn.textContent;
    function resetBtn() { btn.textContent = originalLabel; btn.disabled = false; }
    // If the page is restored from bfcache (user clicked → went to Stripe →
    // hit back), the button can stay stuck on "One moment...". Reset it.
    window.addEventListener('pageshow', resetBtn);
    btn.addEventListener('click', async function () {
      const errMsg = document.getElementById(errId);
      // GA4 checkout-intent event, fires the moment they commit to paying.
      if (typeof gtag !== 'undefined') {
        const val = PRODUCT_VALUE[product];
        gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: val,
          items: [{ item_id: product, item_name: PRODUCT_NAME[product] || product, price: val }]
        });
      }
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
        resetBtn();
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

          // Brevo — bind this visitor's browsing history to their contact.
          if (window.mlBrevoIdentify) window.mlBrevoIdentify(email);

          // Brevo — tag as consulting lead, fire GA4 event on Brevo success
          fetch('/api/brevo-subscribe', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, firstName: name.split(' ')[0] || '', source: 'Homepage Contact Form', additionalListIds: [5], utmParams: window.ML && window.ML.getUtmParams ? window.ML.getUtmParams() : undefined }),
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
  // Injected on Lab article pages only (not the index). TWO surfaces:
  //   • end — inline card after the article body (finisher capture).
  //   • bar — slim sticky bottom bar for non-finishers: appears after ~35%
  //           scroll, dismissible (remembered in localStorage), auto-hides
  //           when the footer/end block is in view, short on mobile. Slim +
  //           dismissible keeps it out of Google's intrusive-interstitial
  //           penalty, so rank (the priority) is protected.
  // Both -> Brevo list 12 "Lab Subscribers", fire GA4 generate_lead, and tag
  // LAB_PLACEMENT (end|bar) so we can see which surface actually converts.
  (function () {
    var path = location.pathname.replace(/\/+$/, '');
    var isLabArticle = /^\/the-lab\/.+/.test(path) && !/\/index(\.html)?$/.test(path);
    var wrap = document.querySelector('.article-wrap');
    if (!isLabArticle || !wrap) return;
    var slug = path.split('/').pop();

    // Shared: fire the subscribe to Brevo list 12 + GA4, tag placement.
    function subscribe(email, placement, done, fail) {
      var utm = window.ML && window.ML.getUtmParams ? window.ML.getUtmParams() : undefined;
      fetch('/api/brevo-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'Lab Subscriber',
          additionalListIds: [12], // "Lab Subscribers" list
          extraAttributes: { LAB_ARTICLE: slug, LAB_PLACEMENT: placement },
          utmParams: utm
        })
      }).then(function (r) {
        if (window.ML && window.ML.saveVisitor) window.ML.saveVisitor({ email: email });
        if (window.mlBrevoIdentify) window.mlBrevoIdentify(email);
        if (typeof gtag !== 'undefined') {
          gtag('event', 'generate_lead', { source: 'lab_article', lab_article: slug, placement: placement });
          if (r && r.ok) gtag('event', 'brevo_subscribed', { source: 'lab_article', placement: placement });
        }
        try { localStorage.setItem('ml_lab_subscribed', '1'); } catch (e) {}
        if (done) done();
      }).catch(function () { if (fail) fail(); });
    }

    // ── END-OF-ARTICLE inline card ──
    (function () {
      var block = document.createElement('div');
      block.className = 'lab-end-card';
      block.style.cssText = 'max-width:720px;margin:0 auto;padding:0 24px;';
      block.innerHTML =
        '<div style="border:1px solid rgba(200,130,60,0.28);border-radius:4px;background:rgba(200,130,60,0.05);padding:28px 28px 30px;margin:8px 0 8px;">' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#C8823C;margin-bottom:10px;">The Lab</div>' +
          '<div style="font-size:19px;font-weight:600;letter-spacing:-0.02em;color:#F0EBE4;margin-bottom:8px;line-height:1.3;">Get new breakdowns like this</div>' +
          '<p style="font-size:14px;font-weight:300;color:rgba(240,235,228,0.55);line-height:1.7;margin:0 0 18px;">Operator-level thinking on embedded payments for vertical SaaS. No fluff, no sales spam, unsubscribe anytime.</p>' +
          '<form class="lab-cap-form" novalidate style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<input class="lab-cap-email" type="email" required autocomplete="email" placeholder="you@company.com" aria-label="Email address" style="flex:1;min-width:220px;background:#0d0d0d;border:1px solid rgba(240,235,228,0.18);border-radius:2px;color:#F0EBE4;font-family:inherit;font-size:14px;padding:12px 14px;">' +
            '<button class="lab-cap-btn" type="submit" style="background:#C8823C;color:#0d0d0d;border:none;border-radius:2px;font-family:\'DM Mono\',monospace;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:12px 24px;cursor:pointer;white-space:nowrap;">Subscribe &rarr;</button>' +
          '</form>' +
          '<div class="lab-cap-success" style="display:none;font-size:14px;color:#C8823C;margin-top:14px;">Thanks, you are on the list. First breakdown lands soon.</div>' +
        '</div>';
      wrap.insertAdjacentElement('afterend', block);
      var form = block.querySelector('.lab-cap-form');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = block.querySelector('.lab-cap-email'), btn = block.querySelector('.lab-cap-btn');
        var email = (input.value || '').trim();
        if (!email || email.indexOf('@') < 1) { input.focus(); return; }
        btn.disabled = true; btn.textContent = 'Sending…';
        subscribe(email, 'end',
          function () { block.querySelector('.lab-cap-success').style.display = 'block'; form.style.display = 'none'; },
          function () { btn.disabled = false; btn.textContent = 'Subscribe →'; });
      });
    })();

    // ── SLIM STICKY BOTTOM BAR ──
    (function () {
      var dismissed, subscribed;
      try { dismissed = localStorage.getItem('ml_lab_bar_dismissed'); subscribed = localStorage.getItem('ml_lab_subscribed'); } catch (e) {}
      if (dismissed || subscribed) return;

      var bar = document.createElement('div');
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Subscribe to The Lab');
      bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9998;transform:translateY(115%);transition:transform .55s ease;background:rgba(13,13,13,0.97);border-top:1px solid rgba(200,130,60,0.35);';
      bar.innerHTML =
        '<div style="max-width:1000px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:170px;">' +
            '<span style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#C8823C;margin-right:10px;">The Lab</span>' +
            '<span style="font-size:14px;color:#F0EBE4;font-weight:500;">Get new breakdowns like this.</span>' +
          '</div>' +
          '<form class="lab-bar-form" novalidate style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
            '<input class="lab-bar-email" type="email" required autocomplete="email" placeholder="you@company.com" aria-label="Email address" style="min-width:210px;background:#000;border:1px solid rgba(240,235,228,0.2);border-radius:2px;color:#F0EBE4;font-family:inherit;font-size:13px;padding:9px 12px;">' +
            '<button class="lab-bar-btn" type="submit" style="background:#C8823C;color:#0d0d0d;border:none;border-radius:2px;font-family:\'DM Mono\',monospace;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;padding:9px 18px;cursor:pointer;white-space:nowrap;">Subscribe</button>' +
          '</form>' +
          '<button class="lab-bar-close" type="button" aria-label="Dismiss" style="background:none;border:none;color:rgba(240,235,228,0.5);font-size:22px;line-height:1;cursor:pointer;padding:2px 6px;">&times;</button>' +
        '</div>';
      document.body.appendChild(bar);

      var shown = false, nearEnd = false;
      function render() { bar.style.transform = (shown && !nearEnd) ? 'translateY(0)' : 'translateY(115%)'; }
      function onScroll() {
        var st = window.pageYOffset || document.documentElement.scrollTop;
        var dh = document.documentElement.scrollHeight - window.innerHeight;
        if (dh > 0 && (st / dh) > 0.55) { shown = true; render(); }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Hide the bar as soon as the end-of-article inline card comes into view
      // (fall back to the footer) so the two prompts never show at once.
      var hideAt = document.querySelector('.lab-end-card') || document.querySelector('.site-footer');
      if (hideAt && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { nearEnd = en.isIntersecting; render(); });
        }, { threshold: 0 }).observe(hideAt);
      }

      bar.querySelector('.lab-bar-close').addEventListener('click', function () {
        shown = false; render();
        try { localStorage.setItem('ml_lab_bar_dismissed', '1'); } catch (e) {}
        window.removeEventListener('scroll', onScroll);
      });

      bar.querySelector('.lab-bar-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var input = bar.querySelector('.lab-bar-email'), btn = bar.querySelector('.lab-bar-btn');
        var email = (input.value || '').trim();
        if (!email || email.indexOf('@') < 1) { input.focus(); return; }
        btn.disabled = true; btn.textContent = 'Sending…';
        subscribe(email, 'bar', function () {
          bar.querySelector('div').innerHTML = '<div style="max-width:1000px;margin:0 auto;padding:12px 20px;font-size:14px;color:#C8823C;">Thanks, you are on the list. First breakdown lands soon.</div>';
          setTimeout(function () { shown = false; render(); }, 2600);
        }, function () { btn.disabled = false; btn.textContent = 'Subscribe'; });
      });
    })();
  })();

  // ── CTA CLICK TRACKING (GA4) ──────────────────────
  // One delegated listener covers every tagged CTA on the site:
  //   • cta_click  — generic, fires for ANY [data-analytics] element so nav,
  //                  homepage ladder (multiplier/framework/advisory), and Lab
  //                  links all register. The token is passed as `cta`.
  //   • qsc_click  — additional key event for Quick Start Call intent, kept
  //                  distinct so the "intent to book" funnel step stays clean.
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-analytics]');
    if (!el) return;
    var token = el.getAttribute('data-analytics');
    var ctaPayload = { cta: token, link_location: location.pathname };
    var isQsc = /consult|qsc/.test(token);
    if (typeof gtag !== 'undefined') {
      gtag('event', 'cta_click', ctaPayload);
      if (isQsc) gtag('event', 'qsc_click', { link_location: location.pathname });
    }
    if (window.posthog && window.posthog.capture) {
      window.posthog.capture('cta_click', ctaPayload);
      if (isQsc) window.posthog.capture('qsc_click', { link_location: location.pathname });
    }
  });

  // ── UNIVERSAL LINK CLICK TRACKING (GA4 + PostHog) ──
  // One delegated listener instruments EVERY link that isn't already a tagged
  // CTA above: the Lab "Start here" pillar cards, in-article links, lab cards,
  // footer and back links, on every page and every future article, with zero
  // per-link tagging. `link_section` segments them (e.g. pillar vs article-body)
  // and `link_url` identifies the exact destination.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    if (a.closest('[data-analytics]')) return;            // already tracked as cta_click
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    var section = a.closest('.lab-pillars') ? 'pillar'
                : a.closest('.article-body') ? 'article-body'
                : a.closest('.lab-grid') ? 'lab-card'
                : a.closest('.site-footer') ? 'footer'
                : a.closest('.site-nav, .nav-mobile') ? 'nav'
                : 'other';
    var external = /^https?:\/\//.test(href) && href.indexOf(location.host) === -1;
    var payload = {
      link_url: href,
      link_text: (a.textContent || '').trim().slice(0, 100),
      link_section: section,
      is_external: external,
      link_location: location.pathname
    };
    if (typeof gtag !== 'undefined') gtag('event', 'link_click', payload);
    if (window.posthog && window.posthog.capture) window.posthog.capture('link_click', payload);
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
