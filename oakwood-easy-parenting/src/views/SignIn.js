import { getState } from '../state/appState.js';
import { loginUser, mockGoogleSignIn, getActiveUser } from '../usecases/auth.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';

export function SignIn(){
  const section = document.createElement('section');
  section.className = 'card';
  const users = getState().users || [];
  section.innerHTML = `
    <h1 class="h1">Sign In</h1>
    <p class="subtitle">Use your local parent profile.</p>

    <form class="form">
      <div class="field">
        <label for="username">Username</label>
        <input id="username" name="username" type="text" autocomplete="off" minlength="5" list="userList" required />
        <datalist id="userList">
          ${users.map(u => `<option value="${u.username}"></option>`).join('')}
        </datalist>
      </div>

      <div class="field password-field">
        <label for="password">Password (min 5 characters)</label>
        <div class="password-wrap">
          <input id="password" name="password" type="password" required />
          <button type="button" class="password-toggle" data-password-toggle="password" aria-label="Show password" aria-pressed="false"></button>
        </div>
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Sign In</button>
        <a class="button-secondary" href="#/register">Create New Profile</a>
      </div>
      <div class="actions-row" style="margin-top: var(--space-2);">
        <a class="button-secondary" href="#/forgot-password">Forgot Password?</a>
      </div>
    </form>

    <div class="actions-row" style="margin-top: var(--space-3);">
      <button type="button" class="button-secondary" data-role="google-mock">Sign in with Google</button>
    </div>
  `;

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
      const children = (getState().children || []);
      location.hash = children.length ? '#/select-child' : '#/add-child';
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
      const children = (getState().children || []);
      location.hash = children.length ? '#/select-child' : '#/add-child';
    } catch (err) {
      alert(err.message || 'Google sign-in failed.');
    }
  });

  return section;
}
