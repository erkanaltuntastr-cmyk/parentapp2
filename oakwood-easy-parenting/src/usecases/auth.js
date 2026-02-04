import { getState, saveState } from '../state/appState.js';

async function hashPassword(password){
  if (!crypto?.subtle) {
    throw new Error('Secure hashing is not available in this browser.');
  }
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function normaliseUsername(username){
  return (username || '').trim().toLowerCase();
}

export async function registerUser(username, password, consentGiven){
  if (!consentGiven) throw new Error('Consent is required.');
  const uname = normaliseUsername(username);
  if (!uname) throw new Error('Username is required.');
  if (!password) throw new Error('Password is required.');

  const state = getState();
  const exists = state.users.some(u => u.username.toLowerCase() === uname);
  if (exists) throw new Error('Username already exists.');

  const passwordHash = await hashPassword(password);
  const id = `u_${Date.now()}`;
  const next = {
    ...state,
    users: [...state.users, { id, username: uname, passwordHash }],
    activeUserId: id
  };
  saveState(next);
  return id;
}

export async function loginUser(username, password){
  const uname = normaliseUsername(username);
  if (!uname) throw new Error('Username is required.');
  if (!password) throw new Error('Password is required.');

  const state = getState();
  const user = state.users.find(u => u.username.toLowerCase() === uname);
  if (!user) throw new Error('Invalid username or password.');

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) throw new Error('Invalid username or password.');

  saveState({ ...state, activeUserId: user.id });
  return user.id;
}

export function logout(){
  const state = getState();
  saveState({ ...state, activeUserId: null });
  import('./inactivity.js').then(m => {
    if (m && typeof m.stopInactivity === 'function') m.stopInactivity();
  }).catch(() => {});
}
