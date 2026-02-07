import { getState, saveState } from '../state/appState.js';

async function hashPin(pin){
  if (!crypto?.subtle) {
    throw new Error('Secure hashing is not available in this browser.');
  }
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function setPin(newPin){
  const pin = String(newPin || '').trim();
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits.');
  const state = getState();
  const hash = await hashPin(pin);
  saveState({ ...state, pin: hash });
}

export async function verifyPin(inputPin){
  const pin = String(inputPin || '').trim();
  if (!/^\d{4}$/.test(pin)) return false;
  const state = getState();
  if (!state.pin) return false;
  const hash = await hashPin(pin);
  return hash === state.pin;
}

export function isPinRequired(){
  const state = getState();
  return Boolean(state.pin);
}
