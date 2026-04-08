// Margin Labs — Consulting Modal (shared component)
// Injects modal HTML + CSS into any page on DOMContentLoaded
// Depends on global-state.js (window.ML) being loaded first
// Usage: include this script, then call openConsult(false) from any button

(function() {

// Formspree ID kept for fallback reference only — submissions go via /api/submit-consult
const FORMSPREE_ID = 'xwvrzrov';

// ── MODAL CSS ──────────────────────────────────────────────────────────────
const css = `
.modal-overlay {
  display:none; position:fixed; inset:0; z-index:9000;
  background:rgba(0,0,0,0.82);
  align-items:center; justify-content:center; padding:24px;
  overflow-y:auto;
}
.modal-overlay.open { display:flex; }

.modal {
  background:#0d0d0d; border:1px solid rgba(200,130,60,0.14); border-radius:6px;
  width:100%; max-width:600px;
  margin:auto;
  padding:44px;
  position:relative;
}

.modal-close {
  position:absolute; top:14px; right:16px;
  background:none; border:none; color:rgba(240,235,228,0.3);
  font-family:'DM Mono', monospace; font-size:9px; letter-spacing:0.14em;
  text-transform:uppercase; cursor:pointer; padding:4px 8px;
}
.modal-close:hover { color:#C8823C; }

.modal-context {
  background:#171717; border:1px solid rgba(200,130,60,0.14); border-left:3px solid #C8823C;
  border-radius:2px; padding:14px 18px; margin-bottom:24px;
  display:none;
}
.mc-ctx-lbl { font-family:'DM Mono', monospace; font-size:8px; letter-spacing:0.18em; text-transform:uppercase; color:#C8823C; opacity:0.6; margin-bottom:6px; }
.mc-ctx-val { font-size:13px; font-weight:300; color:rgba(240,235,228,0.52); line-height:1.65; }
.mc-ctx-val strong { color:#F0EBE4; font-weight:400; }

.modal-ey { font-family:'DM Mono', monospace; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:#C8823C; opacity:0.7; margin-bottom:10px; }
.modal-hl { font-size:24px; font-weight:300; letter-spacing:-0.02em; line-height:1.3; margin-bottom:8px; color:#F0EBE4; }
.modal-sub { font-size:13px; font-weight:300; color:rgba(240,235,228,0.52); line-height:1.7; margin-bottom:28px; }

.modal .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
.modal .form-full { margin-bottom:16px; }
.modal .form-full label, .modal .ig-modal label {
  font-family:'DM Mono', monospace; font-size:9px; letter-spacing:0.16em;
  text-transform:uppercase; color:rgba(240,235,228,0.3); display:block; margin-bottom:7px;
}
.modal .ig-modal { display:flex; flex-direction:column; }

.modal select, .modal input[type="email"], .modal input[type="tel"],
.modal input[type="text"], .modal textarea {
  background:#1e1e1e; border:1px solid rgba(200,130,60,0.14); border-radius:2px;
  color:#F0EBE4; font-family:'DM Sans', sans-serif; font-size:14px; font-weight:300;
  padding:11px 14px; width:100%;
  box-sizing:border-box;
}
.modal select {
  appearance:none; -webkit-appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23C8823C' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center; cursor:pointer;
}
.modal select:focus, .modal input:focus, .modal textarea:focus {
  outline:none; border-color:rgba(200,130,60,0.45);
}
.modal select option { background:#1e1e1e; color:#F0EBE4; }
.modal input::placeholder, .modal textarea::placeholder { color:rgba(240,235,228,0.3); }
.modal textarea { resize:vertical; min-height:90px; line-height:1.6; }

.modal .avail-label {
  font-family:'DM Mono', monospace; font-size:9px; letter-spacing:0.16em;
  text-transform:uppercase; color:rgba(240,235,228,0.3); margin-bottom:10px; display:block;
}
.modal .avail-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
.modal .avail-opt {
  display:flex; align-items:center; gap:10px;
  background:#1e1e1e; border:1px solid rgba(200,130,60,0.14); border-radius:2px;
  padding:10px 14px; cursor:pointer; transition:border-color 0.2s;
}
.modal .avail-opt:hover { border-color:rgba(200,130,60,0.35); }
.modal .avail-opt input[type="checkbox"] {
  width:14px; height:14px; min-width:14px; padding:0;
  accent-color:#C8823C; cursor:pointer;
}
.modal .avail-opt span { font-size:13px; font-weight:300; color:#F0EBE4; }

.modal .btn-p {
  background:#C8823C; color:#0d0d0d; border:none; border-radius:2px;
  font-family:'DM Mono', monospace; font-size:10px; font-weight:600; letter-spacing:0.14em;
  text-transform:uppercase; padding:14px 24px; cursor:pointer; transition:opacity 0.2s;
  width:100%; display:block; text-align:center;
}
.modal .btn-p:hover { opacity:0.88; }
.modal .btn-p:disabled { opacity:0.45; cursor:not-allowed; }

.modal-note { font-family:'DM Mono', monospace; font-size:8px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(240,235,228,0.3); margin-top:10px; }
.modal-err { font-size:12px; color:rgba(200,130,60,0.85); margin-top:10px; display:none; font-family:'DM Mono', monospace; letter-spacing:0.08em; }
.modal-success { display:none; text-align:center; padding:20px 0; }
.modal-success-hl { font-size:22px; font-weight:300; letter-spacing:-0.02em; margin-bottom:10px; color:#F0EBE4; }
.modal-success-sub { font-size:14px; font-weight:300; color:rgba(240,235,228,0.52); line-height:1.7; }

@media (max-width:768px) {
  .modal { padding:28px 20px; }
  .modal .form-grid, .modal .avail-grid { grid-template-columns:1fr; }
}
`;

// ── MODAL HTML ──────────────────────────────────────────────────────────────
const html = `
<div class="modal-overlay" id="consult-overlay" role="dialog" aria-modal="true" aria-label="Start the conversation">
  <div class="modal">
    <button class="modal-close" id="consult-close-btn" aria-label="Close">✕ Close</button>

    <div id="consult-form-state">

      <div class="modal-context" id="modal-context">
        <div class="mc-ctx-lbl">Your Margin Multiplier summary</div>
        <div class="mc-ctx-val" id="modal-context-val"></div>
      </div>

      <div class="modal-ey">Work with Margin Labs</div>
      <h2 class="modal-hl" id="modal-hl">Let's talk about your payments opportunity.</h2>
      <p class="modal-sub" id="modal-sub">Tell us a bit about what you're working on. We respond to every inquiry within 48 hours.</p>

      <form id="consult-form">

        <div class="form-grid">
          <div class="ig-modal">
            <label for="c-name">Name</label>
            <input type="text" id="c-name" name="name" placeholder="Your name" required/>
          </div>
          <div class="ig-modal">
            <label for="c-company">Company</label>
            <input type="text" id="c-company" name="company" placeholder="Company name" required/>
          </div>
        </div>

        <div class="form-grid">
          <div class="ig-modal">
            <label for="c-email">Email</label>
            <input type="email" id="c-email" name="email" placeholder="you@company.com" required/>
          </div>
          <div class="ig-modal">
            <label for="c-phone">Phone <span style="opacity:0.5;font-size:0.9em;">(optional)</span></label>
            <input type="tel" id="c-phone" name="phone" placeholder="+1 (555) 000-0000"/>
          </div>
        </div>

        <div class="form-grid">
          <div class="ig-modal">
            <label for="c-volume">Annual Payments Volume</label>
            <select id="c-volume" name="volume">
              <option value="">Select range</option>
              <option value="Under $1M">Under $1M</option>
              <option value="$1M – $5M">$1M – $5M</option>
              <option value="$5M – $10M">$5M – $10M</option>
              <option value="$10M – $25M">$10M – $25M</option>
              <option value="$25M – $50M">$25M – $50M</option>
              <option value="$50M – $100M">$50M – $100M</option>
              <option value="$100M+">$100M+</option>
            </select>
          </div>
          <div class="ig-modal">
            <label for="c-model">Current Payments Model</label>
            <select id="c-model" name="current_model">
              <option value="">Select model</option>
              <option value="None — not started">None — not started</option>
              <option value="ISV Referral">ISV Referral</option>
              <option value="Enhanced Residuals">Enhanced Residuals</option>
              <option value="PayFac-lite">PayFac-lite</option>
              <option value="Full PayFac">Full PayFac</option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>
        </div>

        <div class="form-full">
          <label for="c-message">What are you trying to solve?</label>
          <textarea id="c-message" name="message" placeholder="Tell us what you're working on — the more context the better." required></textarea>
        </div>

        <div class="form-full">
          <span class="avail-label">Availability <span style="opacity:0.5;font-size:0.9em;">(select all that apply)</span></span>
          <div class="avail-grid">
            <label class="avail-opt">
              <input type="checkbox" name="availability" value="Mornings 9–12"/>
              <span>Mornings (9–12)</span>
            </label>
            <label class="avail-opt">
              <input type="checkbox" name="availability" value="Afternoons 12–5"/>
              <span>Afternoons (12–5)</span>
            </label>
            <label class="avail-opt">
              <input type="checkbox" name="availability" value="Late afternoon 4–6"/>
              <span>Late afternoon (4–6)</span>
            </label>
            <label class="avail-opt">
              <input type="checkbox" name="availability" value="Flexible — email me first"/>
              <span>Flexible — email me first</span>
            </label>
          </div>
        </div>

        <div class="form-full">
          <div class="ig-modal">
            <label for="c-tz">Timezone</label>
            <select id="c-tz" name="timezone">
              <option value="">Select timezone</option>
              <option value="ET — Eastern">ET — Eastern</option>
              <option value="CT — Central">CT — Central</option>
              <option value="MT — Mountain">MT — Mountain</option>
              <option value="PT — Pacific">PT — Pacific</option>
              <option value="GMT — London">GMT — London</option>
              <option value="CET — Central Europe">CET — Central Europe</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <input type="hidden" id="c-gap"          name="opportunity_gap"/>
        <input type="hidden" id="c-rec"          name="recommended_model"/>
        <input type="hidden" id="c-source"       name="source"       value="Work With Us"/>
        <input type="hidden" id="c-subject-type" name="subject_type" value="detailed"/>

        <button type="submit" class="btn-p" id="consult-btn" data-analytics="form-submit">
          Start the Conversation →
        </button>
        <div class="modal-err" id="modal-err"></div>
        <p class="modal-note" style="margin-top:12px;">Engagements are selective. We respond to every submission within 48 hours.</p>

      </form>
    </div>

    <div class="modal-success" id="consult-success">
      <div style="font-size:32px;margin-bottom:16px;color:#C8823C;">✓</div>
      <div class="modal-success-hl">You're in.</div>
      <p class="modal-success-sub">We've received your inquiry and will be in touch within 48 hours.<br>Check hello@marginlabs.io if you don't hear from us — just in case it lands in your spam.</p>
      <button class="btn-p" style="margin-top:28px;width:auto;padding:12px 24px;" id="consult-back-btn">Back to page</button>
    </div>
  </div>
</div>
`;

// ── INJECT ON DOM READY ────────────────────────────────────────────────────
function init() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Inject HTML
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);

  // Wire close button
  document.getElementById('consult-close-btn').addEventListener('click', closeConsult);
  document.getElementById('consult-back-btn').addEventListener('click', closeConsult);

  // Wire overlay click to close
  document.getElementById('consult-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeConsult();
  });

  // Wire form submit
  document.getElementById('consult-form').addEventListener('submit', submitConsult);

  // ESC key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeConsult();
  });
}

// ── PUBLIC API ─────────────────────────────────────────────────────────────
window.openConsult = function(fromCalculator, mode) {
  // Reset to defaults
  document.getElementById('modal-context').style.display = 'none';
  document.getElementById('modal-hl').textContent = "Let's talk about your payments opportunity.";
  document.getElementById('modal-sub').textContent = "Tell us a bit about what you're working on. We respond to every inquiry within 48 hours.";
  document.getElementById('c-subject-type').value = mode || 'detailed';
  document.getElementById('c-source').value = mode === 'simple' ? 'Homepage Contact' : 'Work With Us';

  // If called with calculator context and ML.calc has data
  if (fromCalculator && window.ML && window.ML.calc && window.ML.calc.ran) {
    const c = window.ML.calc;

    // Show context strip
    document.getElementById('modal-context').style.display = 'block';
    document.getElementById('modal-context-val').innerHTML =
      '<strong>' + c.volLbl + '</strong> in annual payments volume · <strong>' + c.curLbl + '</strong> current model · <strong>' + c.gapAmt + '</strong> opportunity gap';

    // Update headline
    document.getElementById('modal-hl').textContent =
      c.ctaType === 'consult-only'
        ? "Let's talk about optimising your payments program."
        : "Let's talk about your path to " + c.recModel + ".";

    document.getElementById('modal-sub').textContent = "We've pre-filled what we know. Add your contact details and we'll be in touch within 48 hours.";

    // Pre-fill volume dropdown
    const volSel = document.getElementById('c-volume');
    for (let o of volSel.options) {
      if (o.value === c.volLbl) { o.selected = true; break; }
    }

    // Pre-fill model dropdown
    const modSel = document.getElementById('c-model');
    for (let o of modSel.options) {
      if (o.value === c.curLbl) { o.selected = true; break; }
    }

    // Set hidden fields
    document.getElementById('c-gap').value = c.gapAmt;
    document.getElementById('c-rec').value = c.recModel;
    document.getElementById('c-source').value    = 'Margin Multiplier';
    document.getElementById('c-subject-type').value = 'detailed';
  }

  // Pre-fill visitor fields from ML state
  if (window.ML) {
    window.ML.prefillVisitor('c-name', 'c-company', 'c-email', 'c-phone');
  }

  // Reset form state
  document.getElementById('consult-form-state').style.display = 'block';
  document.getElementById('consult-success').style.display    = 'none';
  document.getElementById('modal-err').style.display          = 'none';

  // Reset submit button
  const btn = document.getElementById('consult-btn');
  btn.disabled = false;
  btn.textContent = 'Start the Conversation →';

  document.getElementById('consult-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeConsult = function() {
  document.getElementById('consult-overlay').classList.remove('open');
  document.body.style.overflow = '';
};

async function submitConsult(e) {
  e.preventDefault();
  const btn   = document.getElementById('consult-btn');
  const errEl = document.getElementById('modal-err');
  errEl.style.display = 'none';

  const name    = document.getElementById('c-name').value.trim();
  const company = document.getElementById('c-company').value.trim();
  const email   = document.getElementById('c-email').value.trim();
  const phone   = document.getElementById('c-phone').value.trim();
  const volume  = document.getElementById('c-volume').value;
  const model   = document.getElementById('c-model').value;
  const message = document.getElementById('c-message').value.trim();
  const tz      = document.getElementById('c-tz').value;

  if (!name || !company || !email || !message) {
    errEl.textContent = 'Please fill in name, company, email, and message.';
    errEl.style.display = 'block'; return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.style.display = 'block'; return;
  }

  // Save to ML state
  if (window.ML) {
    window.ML.saveVisitor({ name, company, email, phone });
  }

  const avail = [...document.querySelectorAll('#consult-form input[name="availability"]:checked')]
    .map(cb => cb.value).join(', ') || 'Not specified';

  btn.disabled = true; btn.textContent = 'Sending...';

  const payload = {
    name, company, email,
    phone:           phone || 'Not provided',
    volume:          volume || 'Not specified',
    current_model:   model || 'Not specified',
    message,
    availability:    avail,
    timezone:        tz || 'Not specified',
    opportunity_gap: document.getElementById('c-gap').value || '',
    recommended:     document.getElementById('c-rec').value || '',
    source:          document.getElementById('c-source').value,
    subject_type:    document.getElementById('c-subject-type').value,
  };

  try {
    const res = await fetch('/api/submit-consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('failed');
    document.getElementById('consult-form-state').style.display = 'none';
    document.getElementById('consult-success').style.display = 'block';
  } catch(err) {
    btn.disabled = false;
    btn.textContent = 'Start the Conversation →';
    errEl.textContent = 'Something went wrong. Please email hello@marginlabs.io directly.';
    errEl.style.display = 'block';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
