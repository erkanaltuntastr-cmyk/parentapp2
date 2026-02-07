import { setLegalConsent } from '../usecases/auth.js';
import { getState } from '../state/appState.js';

export function LegalConsent(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Legal Consent</h1>
    <p class="subtitle">Please review and accept before continuing.</p>

    <div class="field">
      <p class="help">
        No Liability: Oakwood provides guidance based on information you enter. We do not guarantee outcomes,
        assume responsibility for decisions you make, or accept liability for any direct or indirect loss.
      </p>
      <p class="help">A copy of this agreement will be sent to your email. (Mock)</p>
    </div>

    <form class="form">
      <div class="field">
        <label>
          <input id="consent" type="checkbox" />
          I accept the legal terms and confirm I understand the limitations.
        </label>
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Continue</button>
        <a class="button-secondary" href="#/signin">Back to sign in</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const checked = section.querySelector('#consent').checked;
    if (!checked) {
      alert('You must accept the legal terms to continue.');
      return;
    }
    try {
      setLegalConsent(true);
      const children = (getState().children || []);
      location.hash = children.length ? '#/select-child' : '#/add-child';
    } catch (err) {
      alert(err.message || 'Unable to record consent.');
    }
  });

  return section;
}
