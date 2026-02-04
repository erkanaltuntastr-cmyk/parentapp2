export function Welcome(){
  const container = document.createElement('section');
  container.className = 'card';

  container.innerHTML = `
    <h1 class="h1">A clear, structured view of a child's learning — aligned with the UK curriculum.</h1>
    <p class="sr-only" id="welcome-desc">Welcome to Oakwood easy parenting.</p>
    <div class="actions" aria-describedby="welcome-desc">
      <a class="button" href="#/add-child" data-role="primary-cta">Start with a child</a>
      <div style="margin-top: var(--space-2);">
        <a class="button-secondary" href="#/signin">Sign in to an existing profile</a>
      </div>
    </div>
  `;
  return container;
}
