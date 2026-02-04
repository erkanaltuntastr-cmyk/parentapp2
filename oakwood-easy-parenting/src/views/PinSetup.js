import { setPin } from '../usecases/pin.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';

export function PinSetup(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Set Parent Mode PIN</h1>
    <p class="subtitle">Protect sensitive actions on this device.</p>

    <form class="form">
      <div class="field password-field">
        <label for="pin">4-digit PIN</label>
        <div class="password-wrap">
          <input id="pin" name="pin" type="password" inputmode="numeric" pattern="^\\d{4}$" placeholder="****" required />
          <button type="button" class="password-toggle" data-password-toggle="pin" aria-label="Show PIN" aria-pressed="false"></button>
        </div>
      </div>

      <div class="field password-field">
        <label for="pinConfirm">Confirm PIN</label>
        <div class="password-wrap">
          <input id="pinConfirm" name="pinConfirm" type="password" inputmode="numeric" pattern="^\\d{4}$" placeholder="****" required />
          <button type="button" class="password-toggle" data-password-toggle="pinConfirm" aria-label="Show PIN confirmation" aria-pressed="false"></button>
        </div>
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Save PIN</button>
        <a class="button-secondary" href="#/settings">Back to settings</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  attachPasswordToggles(section);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const pin = form.pin.value;
    const confirm = form.pinConfirm.value;
    if (pin !== confirm) {
      alert('PINs do not match.');
      return;
    }
    try {
      await setPin(pin);
      window.__oakwoodPinVerified = true;
      location.hash = '#/settings';
    } catch (err) {
      alert(err.message || 'Unable to set PIN.');
    }
  });

  return section;
}
