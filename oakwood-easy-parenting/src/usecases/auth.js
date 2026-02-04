import { getState, saveState } from '../state/appState.js';

export const ADMIN_USERNAME = 'oakwood_admin';
const ADMIN_PASSWORD = 'Acorn*2026';
const ADMIN_HASH = '7f3b758355876255fc9196bea02b06c21e389a3e1f82b51846ad18225a5f6749';

export async function hashPassword(password){
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

function isValidUsername(username){
  const raw = (username || '').trim();
  return raw.length >= 5;
}

function isValidPassword(password){
  return String(password || '').length >= 5;
}

export async function registerUser(username, password){
  const uname = normaliseUsername(username);
  if (!isValidUsername(uname)) throw new Error('Username must be at least 5 characters.');
  if (!isValidPassword(password)) throw new Error('Password must be at least 5 characters.');
  if (uname === ADMIN_USERNAME) throw new Error('Username is reserved.');

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
  if (!isValidUsername(uname)) throw new Error('Username must be at least 5 characters.');
  if (!isValidPassword(password)) throw new Error('Password must be at least 5 characters.');

  if (uname === ADMIN_USERNAME) {
    const passwordHash = await hashPassword(password);
    if (passwordHash !== ADMIN_HASH) throw new Error('Invalid username or password.');
    saveState({ ...getState(), activeUserId: 'admin' });
    return 'admin';
  }

  const state = getState();
  const user = state.users.find(u => u.username.toLowerCase() === uname);
  if (!user) throw new Error('Invalid username or password.');

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) throw new Error('Invalid username or password.');

  const next = { ...state, activeUserId: user.id };
  if (user.role === 'child' && user.childId) {
    next.activeChildId = user.childId;
  }
  saveState(next);
  return user.id;
}

export function getActiveUser(){
  const state = getState();
  const id = state.activeUserId;
  if (!id) return null;
  if (id === 'admin') {
    return { id: 'admin', username: ADMIN_USERNAME, isAdmin: true, consentGiven: true };
  }
  return state.users.find(u => u.id === id) || null;
}

export function setLegalConsent(consentGiven){
  if (!consentGiven) throw new Error('Consent is required.');
  const state = getState();
  const id = state.activeUserId;
  if (!id) throw new Error('No active user.');
  const users = state.users.map(u => {
    if (u.id !== id) return u;
    return { ...u, consentGiven: true, consentAt: new Date().toISOString() };
  });
  saveState({ ...state, users });
}

export function updateParentProfile(profile){
  const state = getState();
  const id = state.activeUserId;
  if (!id) throw new Error('No active user.');
  const users = state.users.map(u => {
    if (u.id !== id) return u;
    return { ...u, profile: { ...profile } };
  });
  saveState({ ...state, users, parent: { ...profile } });
}

export async function mockGoogleSignIn(){
  const state = getState();
  let username = '';
  let tries = 0;
  while (!username || state.users.some(u => u.username === username)) {
    const rand = Math.floor(100 + Math.random() * 900);
    username = `parent-n${rand}`;
    tries += 1;
    if (tries > 5) break;
  }
  if (state.users.some(u => u.username === username)) {
    const existing = state.users.find(u => u.username === username);
    saveState({ ...state, activeUserId: existing.id });
    return existing.username;
  }
  const password = `G${Math.floor(100000 + Math.random() * 900000)}*`;
  const passwordHash = await hashPassword(password);
  const id = `u_${Date.now()}`;
  const next = {
    ...state,
    users: [...state.users, { id, username, passwordHash }],
    activeUserId: id
  };
  saveState(next);
  return username;
}

export async function resetPassword(username, newPassword){
  const uname = normaliseUsername(username);
  if (!isValidUsername(uname)) throw new Error('Username must be at least 5 characters.');
  if (!isValidPassword(newPassword)) throw new Error('Password must be at least 5 characters.');
  if (uname === ADMIN_USERNAME) throw new Error('Admin password cannot be reset here.');
  const state = getState();
  const user = state.users.find(u => u.username.toLowerCase() === uname);
  if (!user) throw new Error('User not found.');
  const passwordHash = await hashPassword(newPassword);
  const users = state.users.map(u => u.id === user.id ? { ...u, passwordHash } : u);
  saveState({ ...state, users });
  return true;
}

export function logout(){
  const state = getState();
  saveState({ ...state, activeUserId: null });
  try {
    window.__oakwoodPinVerified = false;
    window.__oakwoodPinRedirect = '';
  } catch {}
  import('./inactivity.js').then(m => {
    if (m && typeof m.stopInactivity === 'function') m.stopInactivity();
  }).catch(() => {});
}
