import { getState, saveState } from '../state/appState.js';
import { getAvailableSubjects } from './curriculum.js';

function normalizeSubjectEntry(entry){
  if (!entry || typeof entry !== 'object') {
    const name = String(entry || '').trim();
    return name ? { name, active: true, addedAt: new Date().toISOString() } : null;
  }
  const name = String(entry.name || entry.subject || '').trim();
  if (!name) return null;
  return {
    name,
    active: typeof entry.active === 'boolean' ? entry.active : true,
    addedAt: entry.addedAt || new Date().toISOString()
  };
}

function getChildSubjects(child){
  if (!child || !Array.isArray(child.subjects)) return [];
  return child.subjects.map(normalizeSubjectEntry).filter(Boolean);
}

export function listSubjects(childId, opts = {}){
  if (!childId) return [];
  const { includePassive = true } = opts;
  const state = getState();
  const child = state.children.find(c => c.id === childId);
  const list = getChildSubjects(child);
  return includePassive ? list : list.filter(s => s.active);
}

export function listSubjectNames(childId, opts = {}){
  return listSubjects(childId, opts).map(s => s.name);
}

export function hasSubject(childId, name){
  const subject = (name || '').trim().toLowerCase();
  if (!childId || !subject) return false;
  return listSubjects(childId).some(s => s.name.toLowerCase() === subject);
}

export function addSubject(childId, name, active = true){
  const subject = (name || '').trim();
  if (!childId || !subject) return;
  const state = getState();
  const nextChildren = state.children.map(c => {
    if (c.id !== childId) return c;
    const subjects = getChildSubjects(c);
    const idx = subjects.findIndex(s => s.name.toLowerCase() === subject.toLowerCase());
    if (idx >= 0) {
      subjects[idx] = { ...subjects[idx], active: true };
    } else {
      subjects.push({ name: subject, active: Boolean(active), addedAt: new Date().toISOString() });
    }
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
    const subjects = getChildSubjects(c).filter(s => s.name.toLowerCase() !== subject.toLowerCase());
    return { ...c, subjects };
  });
  saveState({ ...state, children: nextChildren });
}

export function setSubjectActive(childId, name, active){
  const subject = (name || '').trim();
  if (!childId || !subject) return;
  const state = getState();
  const nextChildren = state.children.map(c => {
    if (c.id !== childId) return c;
    const subjects = getChildSubjects(c).map(s => {
      if (s.name.toLowerCase() !== subject.toLowerCase()) return s;
      return { ...s, active: Boolean(active) };
    });
    return { ...c, subjects };
  });
  saveState({ ...state, children: nextChildren });
}

export async function ensureSubjectsForYear(childId, year, opts = {}){
  if (!childId) return { added: 0, subjects: [] };
  const available = await getAvailableSubjects(year);
  if (!available.length) return { added: 0, subjects: [] };
  const state = getState();
  let added = 0;
  const nextChildren = state.children.map(c => {
    if (c.id !== childId) return c;
    const subjects = getChildSubjects(c);
    const existing = new Set(subjects.map(s => s.name.toLowerCase()));
    available.forEach(subject => {
      const name = String(subject || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (existing.has(key)) return;
      subjects.push({
        name,
        active: typeof opts.active === 'boolean' ? opts.active : true,
        addedAt: new Date().toISOString()
      });
      existing.add(key);
      added += 1;
    });
    return added ? { ...c, subjects } : c;
  });
  if (added) {
    saveState({ ...state, children: nextChildren });
  }
  return { added, subjects: available };
}
