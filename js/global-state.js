// Margin Labs — shared visitor state
// Persists form data across the session so fields pre-fill everywhere
window.ML = window.ML || {
  // Visitor info — populated as they fill in forms anywhere on the site
  visitor: {
    name:    '',
    company: '',
    email:   '',
    phone:   '',
  },
  // Calculator results — populated after running the Margin Multiplier
  calc: {
    ran:         false,   // whether the calculator has been run this session
    arrLbl:      '',
    volLbl:      '',
    curLbl:      '',
    vertLbl:     '',
    recModel:    '',
    gapAmt:      '',
    ctaType:     '',      // 'primer' | 'consult' | 'consult-only'
  },

  // Save visitor fields from any form on the site
  saveVisitor: function(obj) {
    if (obj.name)    this.visitor.name    = obj.name;
    if (obj.company) this.visitor.company = obj.company;
    if (obj.email)   this.visitor.email   = obj.email;
    if (obj.phone)   this.visitor.phone   = obj.phone;
  },

  // Save calculator results
  saveCalc: function(obj) {
    Object.assign(this.calc, obj);
    this.calc.ran = true;
  },

  // Pre-fill a form element if ML state has a value and the field is empty
  prefill: function(id, value) {
    const el = document.getElementById(id);
    if (el && !el.value && value) el.value = value;
  },

  // Pre-fill all visitor fields into a form
  prefillVisitor: function(nameId, companyId, emailId, phoneId) {
    this.prefill(nameId,    this.visitor.name);
    this.prefill(companyId, this.visitor.company);
    this.prefill(emailId,   this.visitor.email);
    this.prefill(phoneId,   this.visitor.phone);
  },

  // UTM parameter capture — persists across page navigations via sessionStorage
  getUtmParams: function() {
    try {
      var stored = sessionStorage.getItem('ml_utm');
      return stored ? JSON.parse(stored) : {};
    } catch(e) { return {}; }
  },
};

// Capture UTM params from URL on page load
(function() {
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var params = new URLSearchParams(window.location.search);
  var found = {};
  var hasAny = false;
  utmKeys.forEach(function(key) {
    var val = params.get(key);
    if (val) { found[key] = val; hasAny = true; }
  });
  if (hasAny) {
    try { sessionStorage.setItem('ml_utm', JSON.stringify(found)); } catch(e) {}
  }
})();
