import { registerUser } from '../usecases/auth.js';

export function Register(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Create New Profile</h1>
    <p class="subtitle">Set up a local parent profile.</p>

    <form class="form">
      <div class="field">
        <label for="regUsername">Username</label>
        <input id="regUsername" name="regUsername" type="text" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="regPassword">Password</label>
        <input id="regPassword" name="regPassword" type="password" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="regConfirm">Confirm Password</label>
        <input id="regConfirm" name="regConfirm" type="password" autocomplete="off" required />
      </div>

      <div class="field">
        <label>
          <input id="regConsent" name="regConsent" type="checkbox" />
          I acknowledge that insights are advisory and based on parent-provided data.
        </label>
      </div>

      <small class="help">Forgotten passwords cannot be recovered. Data is stored strictly on this device.</small>

      <div class="actions-row" style="margin-top: var(--space-3);">
        <button type="submit" class="button">Create Profile</button>
        <a class="button-secondary" href="#/signin">Back to sign in</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const username = form.regUsername.value;
    const password = form.regPassword.value;
    const confirm = form.regConfirm.value;
    const consent = form.regConsent.checked;

    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }

    try {
      await registerUser(username, password, consent);
      location.hash = '#/welcome';
    } catch (err) {
      alert(err.message || 'Registration failed.');
    }
  });

  return section;
}
