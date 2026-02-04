import { verifyPin } from '../usecases/pin.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';

export function PinEntry(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Enter Parent Mode PIN</h1>
    <p class="subtitle">This action is protected.</p>

    <form class="form">
      <div class="field password-field">
        <label for="pin">PIN</label>
        <div class="password-wrap">
          <input id="pin" name="pin" type="password" inputmode="numeric" pattern="^\\d{4}$" placeholder="****" required />
          <button type="button" class="password-toggle" data-password-toggle="pin" aria-label="Show PIN" aria-pressed="false"></button>
        </div>
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Verify</button>
        <a class="button-secondary" href="#/welcome">Back to welcome</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  attachPasswordToggles(section);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const ok = await verifyPin(form.pin.value);
    if (!ok) {
      alert('Incorrect PIN.');
      return;
    }
    window.__oakwoodPinVerified = true;
    const target = window.__oakwoodPinRedirect || '#/settings';
    window.__oakwoodPinRedirect = '';
    location.hash = target;
  });

  return section;
}
