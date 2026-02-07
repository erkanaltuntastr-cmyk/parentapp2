let container = null;

function ensureContainer(){
  if (container) return container;
  container = document.createElement('div');
  container.className = 'toast-stack';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'false');
  document.body.appendChild(container);
  return container;
}

export function showToast(message, type = 'info', duration = 3200){
  const host = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.textContent = String(message || '').trim();
  host.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });
  const timeout = setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
  toast.addEventListener('click', () => {
    clearTimeout(timeout);
    toast.remove();
  });
}

export const toast = {
  info: (msg, duration) => showToast(msg, 'info', duration),
  success: (msg, duration) => showToast(msg, 'success', duration),
  error: (msg, duration) => showToast(msg, 'error', duration)
};
