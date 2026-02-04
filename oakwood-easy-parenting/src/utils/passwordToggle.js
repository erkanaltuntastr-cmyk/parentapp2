const EYE_SVG = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M2.5 12C4.7 7.8 8.1 5.5 12 5.5S19.3 7.8 21.5 12c-2.2 4.2-5.6 6.5-9.5 6.5S4.7 16.2 2.5 12Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </svg>
`;

export function attachPasswordToggles(root){
  if (!root) return;
  root.querySelectorAll('[data-password-toggle]').forEach(btn => {
    const targetId = btn.getAttribute('data-password-toggle');
    const input = targetId ? root.querySelector(`#${targetId}`) : null;
    if (!input) return;
    btn.innerHTML = EYE_SVG;
    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(isHidden));
    });
  });
}
