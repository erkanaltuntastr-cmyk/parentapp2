import { getState, saveState } from '../state/appState.js';

export function listSubjects(childId){
  if (!childId) return [];
  const state = getState();
  const child = state.children.find(c => c.id === childId);
  return (child && Array.isArray(child.subjects)) ? child.subjects : [];
}

export function addSubject(childId, name){
  const subject = (name || '').trim();
  if (!childId || !subject) return;
  const state = getState();
  const nextChildren = state.children.map(c => {
    if (c.id !== childId) return c;
    const subjects = Array.isArray(c.subjects) ? [...c.subjects] : [];
    const exists = subjects.some(s => s.toLowerCase() === subject.toLowerCase());
    if (!exists) subjects.push(subject);
    return { ...c, subjects };
  });
  saveState({ ...state, children: nextChildren });
}

export function removeSubject(childId, name){
  const subject = (name || '').trim();
  if (!childId || !subject) return;
  const state = getState();
  const nextChildren = state.children.map(c => {
    if (c.id !== childId) return c;
    const subjects = Array.isArray(c.subjects) ? c.subjects.filter(s => s !== subject) : [];
    return { ...c, subjects };
  });
  saveState({ ...state, children: nextChildren });
}
