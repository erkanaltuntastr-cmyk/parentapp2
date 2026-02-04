import { getState } from '../state/appState.js';
import { loginUser } from '../usecases/auth.js';

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
        <select id="username" name="username" required>
          ${users.map(u => `<option value="${u.username}">${u.username}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="off" required />
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Sign In</button>
        <a class="button-secondary" href="#/register">Create New Profile</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const username = form.username.value;
    const password = form.password.value;
    try {
      await loginUser(username, password);
      location.hash = '#/welcome';
    } catch (err) {
      alert(err.message || 'Sign in failed.');
    }
  });

  return section;
}
