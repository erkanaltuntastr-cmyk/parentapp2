import { getState, saveState } from '../state/appState.js';

export function listTeachers(){
  const state = getState();
  return Array.isArray(state.teachers) ? state.teachers : [];
}

export function addTeacher({ name, email, childIds }){
  const state = getState();
  const teacher = {
    id: `t_${Date.now()}`,
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    childIds: Array.isArray(childIds) ? childIds : []
  };
  const next = { ...state, teachers: [...(state.teachers || []), teacher] };
  saveState(next);
  return teacher.id;
}

export function getTeachersForChild(childId){
  const list = listTeachers();
  return list.filter(t => Array.isArray(t.childIds) && t.childIds.includes(childId));
}
