import { getState, saveState } from '../state/appState.js';

let mockCache = null;

async function loadMockHomework(){
  if (mockCache) return mockCache;
  try {
    const res = await fetch('data/mock-homework.json');
    if (!res.ok) return { subjects: {} };
    mockCache = await res.json();
    return mockCache;
  } catch {
    return { subjects: {} };
  }
}

export function listHomework(childId, subject){
  const state = getState();
  const list = Array.isArray(state.homework) ? state.homework : [];
  return list.filter(item => {
    if (childId && item.childId !== childId) return false;
    if (subject && item.subject !== subject) return false;
    return true;
  });
}

export function hasPendingHomework(childId, subject){
  return listHomework(childId, subject).some(item => item.status !== 'completed');
}

export function markHomeworkComplete(id){
  const state = getState();
  const next = (state.homework || []).map(item => {
    if (item.id !== id) return item;
    return { ...item, status: 'completed', completedAt: new Date().toISOString() };
  });
  saveState({ ...state, homework: next });
}

export function clearHomework(childId, subject){
  const state = getState();
  const next = (state.homework || []).filter(item => {
    if (childId && item.childId !== childId) return true;
    if (subject && item.subject !== subject) return true;
    return false;
  });
  saveState({ ...state, homework: next });
}

export async function generateHomework(childId, subject){
  const state = getState();
  const data = await loadMockHomework();
  const bySubject = data.subjects || {};
  const key = Object.keys(bySubject).find(k => k.toLowerCase() === String(subject || '').toLowerCase());
  const payload = key ? bySubject[key] : null;
  if (!payload) return [];

  const makeItems = (type, title, list) => (list || []).map(content => ({
    id: `h_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    childId,
    subject: key,
    type,
    title,
    content,
    status: 'pending',
    createdAt: new Date().toISOString()
  }));

  const items = [
    ...makeItems('memory', 'Memory Card', payload.memoryCards),
    ...makeItems('formula', 'Key Formula / Fact Sheet', payload.formulaSheets),
    ...makeItems('mistake', 'Common Mistakes', payload.commonMistakes)
  ];

  const next = { ...state, homework: [...(state.homework || []), ...items] };
  saveState(next);
  return items;
}
