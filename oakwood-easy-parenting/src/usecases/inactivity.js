import { logout } from './auth.js';

const TIMEOUT_MS = 600000;
const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

let timerId = null;
let active = false;

function resetTimer(){
  if (timerId) clearTimeout(timerId);
  timerId = setTimeout(() => {
    logout();
    location.hash = '#/signin';
  }, TIMEOUT_MS);
}

function onActivity(){
  resetTimer();
}

export function startInactivity(){
  if (!active) {
    events.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));
    active = true;
  }
  resetTimer();
}

export function stopInactivity(){
  if (!active) return;
  events.forEach(ev => window.removeEventListener(ev, onActivity));
  active = false;
  if (timerId) clearTimeout(timerId);
  timerId = null;
}
