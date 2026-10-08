/* Ora beta waitlist.
   Sign-ups POST to Ora's own joinWaitlist endpoint (Ora's Firebase), which
   stores them for the admin dashboard's Waitlist card. If that fails, the
   visitor is asked to email support instead. */
const FORM_ENDPOINT = 'https://us-central1-ora-app-ericzhu.cloudfunctions.net/joinWaitlist';

const form = document.querySelector('#waitlist-form');
const emailInput = document.querySelector('#email');
const companyInput = document.querySelector('#company');
const submitButton = document.querySelector('#waitlist-submit');
const statusEl = document.querySelector('#waitlist-status');

const supportEmail = 'support@oracoach.app';
const allowedGoals = new Set(['powerlifting', 'bodybuilding', 'powerbuilding', 'all-in-one']);

const getPrimaryGoal = () => {
  const selected = document.querySelector('input[name="primary_goal"]:checked');
  if (!selected || !allowedGoals.has(selected.value)) return 'not selected';
  return selected.value;
};

const setStatus = (message, type) => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `form-status ${type || ''}`.trim();
};

const mailtoFallback = (email) => {
  const subject = 'Ora beta access request';
  const body = [
    'I would like to join the Ora beta.',
    '',
    `Email: ${email}`,
    `Primary goal: ${getPrimaryGoal()}`,
    `Page: ${window.location.href}`,
  ].join('\n');
  window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  setStatus(`Opening your email app. If nothing opens, email ${supportEmail}.`, 'success');
};

if (form && emailInput && companyInput && submitButton) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    if (!email || !emailInput.validity.valid) {
      setStatus('Enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    // honeypot: bots fill the hidden "company" field — silently accept, do nothing
    if (companyInput.value) {
      setStatus("You're on the list. We'll be in touch.", 'success');
      return;
    }

    // No backend configured yet → open the user's email client.
    if (!FORM_ENDPOINT) {
      mailtoFallback(email);
      return;
    }

    const original = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Joining…';
    setStatus('Joining the beta queue…');

    try {
      // URL-encoded, so the browser sends it without a CORS preflight.
      const data = new URLSearchParams();
      data.append('email', email);
      data.append('primary_goal', getPrimaryGoal());
      data.append('page', window.location.pathname);

      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });

      if (res.ok) {
        form.reset();
        setStatus("You're on the list. We'll email you about beta access — no spam.", 'success');
        submitButton.textContent = 'Joined ✓';
        // leave disabled to prevent double-submits
      } else {
        throw new Error('Bad response');
      }
    } catch (err) {
      submitButton.disabled = false;
      submitButton.textContent = original;
      setStatus(`Something went wrong. Email ${supportEmail} and we'll add you.`, 'error');
    }
  });
}
