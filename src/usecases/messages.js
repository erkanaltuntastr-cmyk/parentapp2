import { getState, saveState } from '../state/appState.js';
import { ADMIN_USERNAME } from './auth.js';

function normaliseUser(value){
  return (value || '').trim();
}

export function getMessages(){
  const state = getState();
  return Array.isArray(state.messages) ? state.messages : [];
}

export function sendMessage(from, to, text){
  const state = getState();
  const fromUser = normaliseUser(from);
  const toUser = normaliseUser(to);
  const body = String(text || '').trim();
  if (!fromUser || !toUser || !body) return false;
  const msg = {
    id: `m_${Date.now()}`,
    from: fromUser,
    to: toUser,
    text: body,
    at: new Date().toISOString(),
    read: false
  };
  const next = { ...state, messages: [...(state.messages || []), msg] };
  saveState(next);
  return true;
}

export function getUnreadCountForUser(username){
  const user = normaliseUser(username);
  if (!user) return 0;
  return getMessages().filter(m => m.to === user && m.from === ADMIN_USERNAME && !m.read).length;
}

export function markReadForUser(username){
  const user = normaliseUser(username);
  const state = getState();
  if (!user) return;
  const messages = (state.messages || []).map(m => {
    if (m.to === user && m.from === ADMIN_USERNAME && !m.read) return { ...m, read: true };
    return m;
  });
  saveState({ ...state, messages });
}
