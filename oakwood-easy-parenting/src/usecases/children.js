import { getState, saveState } from '../state/appState.js';
import { hashPassword, ADMIN_USERNAME } from './auth.js';

function sanitizeNotes(value){
  const raw = String(value || '');
  const cleaned = raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 500);
}

export async function addChild(childData){
  const state = getState();
  const id = `c_${Date.now()}`;
  const notes = sanitizeNotes(childData?.notes);
  const ownerId = state.activeUserId && state.activeUserId !== 'admin' ? state.activeUserId : null;
  const studentUsernameRaw = String(childData?.studentUsername || '').trim();
  const studentPassword = String(childData?.studentPassword || '');
  let users = state.users;
  let studentUserId = null;

  if (studentUsernameRaw || studentPassword) {
    const studentUsername = studentUsernameRaw.toLowerCase();
    if (studentUsername.length < 5) throw new Error('Student username must be at least 5 characters.');
    if (studentPassword.length < 5) throw new Error('Student password must be at least 5 characters.');
    if (studentUsername === ADMIN_USERNAME) throw new Error('Student username is reserved.');
    if (users.some(u => u.username.toLowerCase() === studentUsername)) {
      throw new Error('Student username already exists.');
    }
    const passwordHash = await hashPassword(studentPassword);
    studentUserId = `u_${Date.now()}`;
    users = [...users, { id: studentUserId, username: studentUsername, passwordHash, role: 'child', childId: id }];
  }

  const child = {
    id,
    ...childData,
    notes,
    ...(ownerId ? { userId: ownerId } : {}),
    ...(studentUserId ? { studentUserId } : {})
  };
  delete child.studentUsername;
  delete child.studentPassword;

  const next = {
    ...state,
    users,
    children: [...state.children, child],
    activeChildId: id
  };
  saveState(next);
  return id;
}

export function setActiveChild(childId){
  const state = getState();
  const next = { ...state, activeChildId: childId };
  saveState(next);
}

export function deleteChild(childId){
  const state = getState();
  const nextChildren = state.children.filter(c => c.id !== childId);
  const next = {
    ...state,
    children: nextChildren,
    activeChildId: state.activeChildId === childId ? null : state.activeChildId
  };
  saveState(next);
}

export function getActiveChild(){
  const state = getState();
  const id = state.activeChildId;
  if (!id) return null;
  return state.children.find(c => c.id === id) || null;
}
