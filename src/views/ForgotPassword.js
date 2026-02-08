import { resetPassword } from '../usecases/auth.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';

function toProperCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function ForgotPassword(){
  const container = document.createElement('div');
  container.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-8';
  
  const section = document.createElement('section');
  section.className = 'w-full max-w-md bg-white rounded-xl p-7 shadow-lg border border-neutral-100 animate-slideUp';
  section.innerHTML = `
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-neutral-900 mb-2">Reset Password</h1>
      <p class="text-neutral-600 text-sm">Enter Your Username And New Password</p>
    </div>

    <form class="form space-y-4">
      <div class="field">
        <label for="fpUsername" class="block text-sm font-semibold text-neutral-900 mb-1.5">Username</label>
        <input id="fpUsername" name="fpUsername" type="text" autocomplete="off" minlength="5" required class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div class="field password-field">
        <label for="fpPassword" class="block text-sm font-semibold text-neutral-900 mb-1.5">New Password</label>
        <div class="password-wrap relative">
          <input id="fpPassword" name="fpPassword" type="password" required class="w-full px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button type="button" class="password-toggle absolute right-3 top-2.5 w-5 h-5" data-password-toggle="fpPassword" aria-label="Show password"></button>
        </div>
      </div>

      <div class="field password-field">
        <label for="fpConfirm" class="block text-sm font-semibold text-neutral-900 mb-1.5">Confirm Password</label>
        <div class="password-wrap relative">
          <input id="fpConfirm" name="fpConfirm" type="password" required class="w-full px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button type="button" class="password-toggle absolute right-3 top-2.5 w-5 h-5" data-password-toggle="fpConfirm" aria-label="Show password"></button>
        </div>
      </div>

      <button type="submit" class="w-full button bg-primary-600 text-white py-2.5 mt-6">Reset Password</button>
    </form>

    <a href="#/signin" class="block mt-4 w-full button-secondary py-2.5 text-center text-sm font-medium">Back to Sign In</a>
  `;

  container.appendChild(section);

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

  return container;
}
