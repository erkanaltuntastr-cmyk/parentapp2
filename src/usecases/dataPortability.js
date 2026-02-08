import { getState, saveState } from '../state/appState.js';

const CURRENT_VERSION = 1;

function getDefaultTermStartDate(){
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 8 ? year : year - 1;
  const start = new Date(startYear, 8, 1);
  return start.toISOString().slice(0, 10);
}

export function exportData(){
  const state = getState();
  const payload = {
    _meta: state.__meta ?? { version: CURRENT_VERSION },
    users: state.users ?? [],
    activeUserId: state.activeUserId ?? null,
    familyName: state.familyName ?? '',
    parent: state.parent ?? null,
    children: state.children ?? [],
    activeChildId: state.activeChildId ?? null,
    pin: state.pin ?? null,
    messages: state.messages ?? [],
    assignments: state.assignments ?? [],
    teachers: state.teachers ?? [],
    homework: state.homework ?? [],
    quizDrafts: state.quizDrafts ?? [],
    quizSessions: state.quizSessions ?? [],
    currentSchoolTermStartDate: state.currentSchoolTermStartDate ?? getDefaultTermStartDate(),
    expectedTeachingWeeks: state.expectedTeachingWeeks ?? 36,
    familyMembers: state.familyMembers ?? []
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `parentops_backup_${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importData(file){
  if (!file) throw new Error('No file selected.');
  let data;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file.');
  }
  if (!data || !data._meta || typeof data._meta.version !== 'number') {
    throw new Error('Invalid backup: missing _meta.version.');
  }
  if (data._meta.version > CURRENT_VERSION) {
    throw new Error('Backup version is not supported.');
  }
  if (!Array.isArray(data.children)) {
    throw new Error('Invalid backup: students must be an array.');
  }
  const nextState = {
    __meta: { 
      version: data._meta.version,
      demoSeeded: data._meta.demoSeeded ?? false
    },
    users: Array.isArray(data.users) ? data.users : [],
    activeUserId: data.activeUserId ?? null,
    familyName: typeof data.familyName === 'string' ? data.familyName : '',
    parent: data.parent ?? null,
    children: data.children,
    activeChildId: data.activeChildId ?? null,
    pin: data.pin ?? null,
    messages: Array.isArray(data.messages) ? data.messages : [],
    assignments: Array.isArray(data.assignments) ? data.assignments : [],
    teachers: Array.isArray(data.teachers) ? data.teachers : [],
    homework: Array.isArray(data.homework) ? data.homework : [],
    quizDrafts: Array.isArray(data.quizDrafts) ? data.quizDrafts : [],
    quizSessions: Array.isArray(data.quizSessions) ? data.quizSessions : [],
    currentSchoolTermStartDate: typeof data.currentSchoolTermStartDate === 'string' && data.currentSchoolTermStartDate ? data.currentSchoolTermStartDate : getDefaultTermStartDate(),
    expectedTeachingWeeks: typeof data.expectedTeachingWeeks === 'number' ? data.expectedTeachingWeeks : 36,
    familyMembers: Array.isArray(data.familyMembers) ? data.familyMembers : []
  };
  saveState(nextState);
}
