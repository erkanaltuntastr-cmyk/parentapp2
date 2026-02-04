export function ChildOverview(){
  const section = document.createElement('section');
  section.className = 'card';

  const child = window.__oakwoodActiveChild || {};
  const name = (child.name || '').trim();
  const year = Number(child.year || 0);
  const school = (child.school || '').trim();

  const title = name ? `${name} — overview` : 'Your child — overview';
  let meta = '';
  if (Number.isFinite(year) && year > 0) {
    meta = `Year ${year}`;
  }
  if (school) {
    meta = meta ? `${meta} • ${school}` : school;
  }

  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    ${meta ? `<p class="subtitle">${meta}</p>` : ''}
    <p>Child profile saved.</p>
    <div class="actions" style="margin-top: var(--space-4);">
      <a class="button" href="#/subjects">View subjects</a>
      <div style="margin-top: var(--space-2);">
        <a class="button-secondary" href="#/add-child">Add another child</a>
      </div>
      <div style="margin-top: var(--space-1);">
        <a class="button-secondary" href="#/welcome">Back to welcome</a>
      </div>
    </div>
  `;

  return section;
}
