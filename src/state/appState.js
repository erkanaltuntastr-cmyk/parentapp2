import { getItem, setItem } from './storage.js';

function getDefaultTermStartDate(){
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 8 ? year : year - 1;
  const start = new Date(startYear, 8, 1);
  return start.toISOString().slice(0, 10);
}

const initialState = {
  __meta: { version: 1, demoSeeded: false },
  users: [],
  activeUserId: null,
  familyName: '',
  parent: null,
  children: [],
  activeChildId: null,
  pin: null,
  messages: [],
  assignments: [],
  teachers: [],
  homework: [],
  quizDrafts: [],
  quizSessions: [],
  currentSchoolTermStartDate: getDefaultTermStartDate(),
  expectedTeachingWeeks: 36,
  familyMembers: []
};

let state = null;

const ESOCT_HASH = '211e8bf37ebf0c114cac7f48a9682dcc60f1045c3852a609e28c3b3caa6b0fcf';

function migrateState(current){
  let changed = false;
  if (!current.__meta || typeof current.__meta !== 'object') {
    current.__meta = { version: 1, demoSeeded: false };
    changed = true;
  }
  if (typeof current.__meta.demoSeeded !== 'boolean') {
    current.__meta.demoSeeded = false;
    changed = true;
  }
  if (!Array.isArray(current.messages)) {
    current.messages = [];
    changed = true;
  }
  if (!Array.isArray(current.assignments)) {
    current.assignments = [];
    changed = true;
  }
  if (!Array.isArray(current.homework)) {
    current.homework = [];
    changed = true;
  }
  if (!Array.isArray(current.quizDrafts)) {
    current.quizDrafts = [];
    changed = true;
  }
  if (!Array.isArray(current.quizSessions)) {
    current.quizSessions = [];
    changed = true;
  }
  if (!Array.isArray(current.teachers)) {
    current.teachers = [];
    changed = true;
  }
  if (!Array.isArray(current.familyMembers)) {
    current.familyMembers = [];
    changed = true;
  }
  if (typeof current.familyName !== 'string') {
    current.familyName = '';
    changed = true;
  }
  if (typeof current.currentSchoolTermStartDate !== 'string' || !current.currentSchoolTermStartDate.trim()) {
    current.currentSchoolTermStartDate = getDefaultTermStartDate();
    changed = true;
  }
  if (!Number.isFinite(current.expectedTeachingWeeks) || current.expectedTeachingWeeks < 1) {
    current.expectedTeachingWeeks = 36;
    changed = true;
  }
  if (Array.isArray(current.users)) {
    current.users = current.users.map(u => {
      if (String(u.username || '').toLowerCase() === 'esoct' && u.passwordHash !== ESOCT_HASH) {
        changed = true;
        return { ...u, passwordHash: ESOCT_HASH };
      }
      return u;
    });
  }
  if (Array.isArray(current.children)) {
    current.children = current.children.map(child => {
      if (!Array.isArray(child.subjects)) return child;
      const needsMigration = child.subjects.some(s => typeof s === 'string' || !s || typeof s !== 'object');
      const nextSubjects = child.subjects.map(s => {
        if (!s || typeof s !== 'object') {
          return { name: String(s || '').trim(), active: true, addedAt: new Date().toISOString() };
        }
        const name = String(s.name || s.subject || '').trim();
        if (!name) return null;
        return {
          name,
          active: typeof s.active === 'boolean' ? s.active : true,
          addedAt: s.addedAt || new Date().toISOString()
        };
      }).filter(Boolean);
      if (needsMigration) {
        changed = true;
        return { ...child, subjects: nextSubjects };
      }
      const normalized = nextSubjects.some(s => typeof s.active !== 'boolean');
      if (normalized) {
        changed = true;
        return { ...child, subjects: nextSubjects };
      }
      return child;
    });
  }
  if (Array.isArray(current.children) && Array.isArray(current.users) && current.users.length === 1) {
    const userId = current.users[0]?.id;
    if (userId && current.children.some(c => !c.userId)) {
      current.children = current.children.map(c => c.userId ? c : { ...c, userId });
      changed = true;
    }
  }
  return changed;
}

function clone(obj){
  return JSON.parse(JSON.stringify(obj));
}

export function loadState(){
  if (state) return state;
  const stored = getItem();
  if (stored && stored.__meta && stored.__meta.version === 1) {
    state = { ...clone(initialState), ...stored };
  } else {
    state = clone(initialState);
  }
  if (migrateState(state)) {
    setItem(state);
  }
  return state;
}

export function saveState(nextState){
  state = clone(nextState);
  setItem(state);
  return state;
}

export function getState(){
  return loadState();
}
