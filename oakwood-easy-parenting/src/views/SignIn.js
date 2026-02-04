export function SignIn(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Sign in</h1>
    <p class="subtitle">Use your local parent profile.</p>

    <form class="form">
      <div class="field">
        <label for="username">Username</label>
        <input id="username" name="username" type="text" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="off" required />
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Sign in</button>
        <a class="button-secondary" href="#/welcome">Back to welcome</a>
      </div>
      <small class="help">This profile is stored on this device. If you forget your password, it cannot be recovered.</small>
    </form>
  `;

  const form = section.querySelector('form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    alert('Sign in is coming next.');
  });

  return section;
}
