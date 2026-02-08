import { getState, saveState } from '../state/appState.js';

function normalize(value){
  return String(value || '').trim().toLowerCase();
}

function normalizeTeacher(raw){
  return {
    id: String(raw?.id || '').trim() || `t_${Date.now()}`,
    name: String(raw?.name || '').trim(),
    email: String(raw?.email || '').trim(),
    childIds: Array.isArray(raw?.childIds) ? raw.childIds.filter(Boolean) : [],
    subject: String(raw?.subject || '').trim()
  };
}

function teacherKey(teacher){
  const name = normalize(teacher.name);
  const email = normalize(teacher.email);
  if (name || email) return `${name}|${email}`;
  return `id:${teacher.id}`;
}

function mergeTeachers(base, incoming){
  const childIds = new Set([...(base.childIds || []), ...(incoming.childIds || [])]);
  return {
    ...base,
    name: base.name || incoming.name,
    email: base.email || incoming.email,
    subject: base.subject || incoming.subject,
    childIds: Array.from(childIds)
  };
}

function dedupeTeachers(list){
  const deduped = [];
  const indexByKey = new Map();
  let changed = false;

  list.forEach(raw => {
    const teacher = normalizeTeacher(raw);
    const key = teacherKey(teacher);
    if (indexByKey.has(key)) {
      const idx = indexByKey.get(key);
      deduped[idx] = mergeTeachers(deduped[idx], teacher);
      changed = true;
      return;
    }
    indexByKey.set(key, deduped.length);
    deduped.push(teacher);
    if (
      raw?.name !== teacher.name
      || raw?.email !== teacher.email
      || raw?.subject !== teacher.subject
      || raw?.id !== teacher.id
    ) {
      changed = true;
    }
  });

  return { list: deduped, changed };
}

export function listTeachers(){
  const state = getState();
  const raw = Array.isArray(state.teachers) ? state.teachers : [];
  const { list, changed } = dedupeTeachers(raw);
  if (changed) {
    saveState({ ...state, teachers: list });
  }
  return list;
}

export function addTeacher({ name, email, childIds, subject }){
  const state = getState();
  const teacher = normalizeTeacher({ name, email, childIds, subject });
  const { list } = dedupeTeachers([...(state.teachers || []), teacher]);
  saveState({ ...state, teachers: list });
  return teacher.id;
}

export function getTeachersForChild(childId){
  const list = listTeachers();
  return list.filter(t => Array.isArray(t.childIds) && t.childIds.includes(childId));
}
