// === CONTACT PAGE PRODUCTION MODULE ===

const API = {
  get BASE() { return getAPIURL(); },
  get PROFILE() { return this.BASE + "/users/me"; },
  get CONTACT() { return this.BASE + "/users/contact"; },
  get SENDQUERY() { return this.BASE + "/users/send-query"; },
};

class ErrorTracker {
  static track(error, ctx={}) {
    console.error('[Contact.Error]', error, ctx);
  }
}

// ✅ Notification system integration
function showNotification(message, type = 'info') {
  if (window.notifications) {
      window.notifications.show(message, type);
  } else {
      // Fallback to alert if notification system not loaded
      alert(message);
  }
}

function showFormMessage(el, msg, color) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || '#222';
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
}

function disableButton(btn, state, label){
  if(!btn) return;
  btn.disabled = state;
  if (label) btn.textContent = label;
}

function validateEmail(email) {
  // Only standard ASCII addresses allowed; basic RFC pattern
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
}

function validateNonEmpty(val) {
  return val && val.trim().length > 0;
}

// Very basic text sanitizer to kill script tags, XML entities, and common spam markup (NOT HTML sanitizer!)
function basicSanitize(str) {
  // Remove <, >, &, \u003c, \u003e, encoded pattern, script/style/xml
  let out = (str||"").replace(/[<>&]/g, "").replace(/\u003c|\u003e/ig, "");
  out = out.replace(/<(script|style|svg|xml|iframe|embed)[^>]*>.*?<\/\1>/gsi, "");
  out = out.replace(/&[a-z#0-9]+;/ig, ""); // Strip most common entities
  out = out.replace(/[\u0000-\u001F\u007F-\u009F]/g,"");
  return out.trim();
}

// Global anti-spam: track last payloads/timestamps client-side
const SpamProtector = {
  _cache: {}, // id => { lastSent, lastPayload }
  check(id, val) {
    const now = Date.now();
    if (!this._cache[id]) this._cache[id] = { lastSent: 0, lastPayload: "" };
    // Block if identical to recent (<30s, unchanged)
    if (now-this._cache[id].lastSent < 30000 && this._cache[id].lastPayload === val)
      return false;
    this._cache[id] = { lastSent: now, lastPayload: val };
    return true;
  }
};
document.addEventListener("DOMContentLoaded", async () => {
  // Sync cart count
  try {
    const cartCount = document.getElementById("cart-count");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalQuantity;
  } catch(e) {ErrorTracker.track(e,{ctx:"cart-badge"});}

  // FAQ toggle
  document.querySelectorAll('.faq-item .faq-question').forEach(question => {
    question.addEventListener('click', e => {
      const item = e.target.closest('.faq-item');
      if (item) item.classList.toggle('open');
    });
    question.addEventListener('keypress', e => {
      if (e.key==='Enter' || e.key===' ') {
        e.preventDefault();
        question.click();
      }
    });
  });

  // Autofill for logged-in users
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      const res = await fetch(API.PROFILE, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        const name = document.getElementById("name");
        const email = document.getElementById("email");
        if(name && email){
          name.value = user.name; name.readOnly = true;
          email.value = user.email; email.readOnly = true;
        }
      }
    } catch (error) { ErrorTracker.track(error,{ctx:'autofill'}); }
  }

  // Main contact form
  const contactForm = document.getElementById("contactForm");
  if(contactForm){
contactForm.addEventListener("submit", async e => {
        e.preventDefault();
        let name = document.getElementById("name")?.value;
        let email = document.getElementById("email")?.value;
        let message = document.getElementById("message")?.value;
        const btn = document.getElementById("sendMessageButton");
        const box = document.getElementById("formMessage");
        name = basicSanitize(name); email = basicSanitize(email); message = basicSanitize(message);
        if (!validateNonEmpty(name) || !validateNonEmpty(message) || !validateEmail(email)) {
          showFormMessage(box, "❌ Please fill all fields with a valid email.", "red");
          return disableButton(btn, false, "Send Message");
        }
        if (!SpamProtector.check("contact", name+email+message)) {
          showFormMessage(box, "⚠️ Please wait before resubmitting the same message.", "orange");
          return disableButton(btn, false, "Send Message");
        }
        disableButton(btn, true, "Sending...");
        showFormMessage(box, "Sending your message...", "#444");
        try {
          const res = await fetch(API.CONTACT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ name, email, message }),
          });
          const data = await res.json();
          if (res.ok) {
            showNotification("✅ Message sent successfully!", "success");
            showFormMessage(box, "✅ Message sent successfully!", "green");
            contactForm.reset();
            setTimeout(() => { window.location.reload(); }, 900);
          } else {
            showNotification('❌ ' + (data.message||'Message not sent.'), "error");
            showFormMessage(box, "❌ Error sending message. Try again.", "red");
          }
        } catch (err) {
          ErrorTracker.track(err, {ctx:'contact-submit'});
          showFormMessage(box, "❌ Server error. Please try again later.", "red");
        }
        setTimeout(() => disableButton(btn, false, "Send Message"), 2000);
     });
  }

  // Query Form
  const queryForm = document.getElementById("queryForm");
  if(queryForm){
queryForm.addEventListener("submit", async e => {
      e.preventDefault();
      let query = document.getElementById("query")?.value;
      const btn = document.getElementById("sendQueryButton");
      const box = document.getElementById("queryMessage");
      query = basicSanitize(query);
      if (!validateNonEmpty(query)) {
        showFormMessage(box, "❌ Please enter your question.", "red");
        return disableButton(btn, false, "Send Query");
      }
      if (!SpamProtector.check("query", query)) {
        showFormMessage(box, "⚠️ Please wait before resubmitting the same query.", "orange");
        return disableButton(btn, false, "Send Query");
      }
      disableButton(btn, true, "Sending...");
      showFormMessage(box, "Sending your query...", "#444");
      try {
        const res = await fetch(API.SENDQUERY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        if (res.ok) {
          showNotification("✅ Query sent successfully!", "success");
          showFormMessage(box, "✅ Query sent successfully!", "green");
          queryForm.reset();
        } else {
          showNotification('❌ ' + (data.message||'Query not sent.'), "error");
          showFormMessage(box, "❌ Error sending query. Try again.", "red");
        }
      } catch (err) {
        ErrorTracker.track(err, {ctx:'query-submit'});
        showFormMessage(box, "❌ Server error. Please try again later.", "red");
      }
      setTimeout(() => disableButton(btn, false, "Send Query"), 2000);
    });
  }

});

// === END CONTACT MODULE ===
