import { resetPassword } from '../usecases/auth.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';

export function ForgotPassword(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Reset Password</h1>
    <p class="subtitle">Reset the password for a local profile on this device.</p>

    <form class="form">
      <div class="field">
        <label for="fpUsername">Username</label>
        <input id="fpUsername" name="fpUsername" type="text" autocomplete="off" minlength="5" required />
      </div>

      <div class="field password-field">
        <label for="fpPassword">New Password (min 5 characters)</label>
        <div class="password-wrap">
          <input id="fpPassword" name="fpPassword" type="password" required />
          <button type="button" class="password-toggle" data-password-toggle="fpPassword" aria-label="Show password" aria-pressed="false"></button>
        </div>
      </div>

      <div class="field password-field">
        <label for="fpConfirm">Confirm New Password</label>
        <div class="password-wrap">
          <input id="fpConfirm" name="fpConfirm" type="password" required />
          <button type="button" class="password-toggle" data-password-toggle="fpConfirm" aria-label="Show password" aria-pressed="false"></button>
        </div>
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Reset Password</button>
        <a class="button-secondary" href="#/signin">Back to sign in</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  attachPasswordToggles(section);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const username = form.fpUsername.value;
    const password = form.fpPassword.value;
    const confirm = form.fpConfirm.value;
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    try {
      await resetPassword(username, password);
      alert('Password updated. You can sign in now.');
      location.hash = '#/signin';
    } catch (err) {
      alert(err.message || 'Password reset failed.');
    }
  });

  return section;
}
