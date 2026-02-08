import { getState } from '../state/appState.js';
import { loginUser, mockGoogleSignIn, getActiveUser } from '../usecases/auth.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';

function toProperCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SignIn(){
  const container = document.createElement('div');
  container.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-8';
  
  const section = document.createElement('section');
  section.className = 'w-full max-w-md bg-white rounded-xl p-7 shadow-lg border border-neutral-100 animate-slideUp';
  
  const users = getState().users || [];
  section.innerHTML = `
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
      <p class="text-neutral-600 text-sm">Sign In To Access Your Family Hub</p>
    </div>

    <form class="form space-y-4">
      <div class="field">
        <label for="username" class="block text-sm font-semibold text-neutral-900 mb-1.5">Username</label>
        <input id="username" name="username" type="text" autocomplete="off" minlength="5" list="userList" required class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        <datalist id="userList">
          ${users.map(u => `<option value="${u.username}"></option>`).join('')}
        </datalist>
      </div>

      <div class="field password-field">
        <label for="password" class="block text-sm font-semibold text-neutral-900 mb-1.5">Password</label>
        <div class="password-wrap relative">
          <input id="password" name="password" type="password" required class="w-full px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          <button type="button" class="password-toggle absolute right-3 top-2.5 w-5 h-5" data-password-toggle="password" aria-label="Show password" aria-pressed="false"></button>
        </div>
      </div>

      <button type="submit" class="w-full button bg-primary-600 text-white py-2.5 mt-6">Sign In</button>
    </form>

    <div class="flex gap-2 mt-4">
      <a href="#/forgot-password" class="flex-1 button-secondary py-2 text-sm">Forgot Password?</a>
      <a href="#/register" class="flex-1 button-secondary py-2 text-sm">Create New</a>
    </div>

    <div class="relative my-5">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-neutral-200"></div>
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="px-2 bg-white text-neutral-600">Or Continue With</span>
      </div>
    </div>

    <button type="button" class="w-full button-secondary py-2.5 text-sm font-medium" data-role="google-mock">Sign In With Google</button>
  `;

  container.appendChild(section);

  const form = section.querySelector('form');
  attachPasswordToggles(section);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const username = form.username.value;
    const password = form.password.value;
    try {
      await loginUser(username, password);
      const user = getActiveUser();
      if (user?.isAdmin) {
        location.hash = '#/admin';
        return;
      }
      if (user?.role === 'child') {
        location.hash = '#/child-dashboard';
        return;
      }
      location.hash = '#/family-hub';
    } catch (err) {
      alert(err.message || 'Sign in failed.');
    }
  });

  const googleBtn = section.querySelector('[data-role="google-mock"]');
  googleBtn.addEventListener('click', async () => {
    try {
      await mockGoogleSignIn();
      const user = getActiveUser();
      alert(`Signed in as ${user?.username || 'Parent'}.`);
      location.hash = '#/family-hub';
    } catch (err) {
      alert(err.message || 'Google sign-in failed.');
    }
  });

  return container;
}
