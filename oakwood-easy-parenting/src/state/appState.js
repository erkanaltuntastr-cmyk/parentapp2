import { getItem, setItem } from './storage.js';

const initialState = {
  __meta: { version: 1 },
  users: [],
  activeUserId: null,
  familyName: '',
  parent: null,
  children: [],
  activeChildId: null,
  pin: null,
  messages: [],
  assignments: [],
  teachers: []
};

let state = null;

const ESOCT_HASH = '211e8bf37ebf0c114cac7f48a9682dcc60f1045c3852a609e28c3b3caa6b0fcf';

function migrateState(current){
  let changed = false;
  if (!Array.isArray(current.messages)) {
    current.messages = [];
    changed = true;
  }
  if (!Array.isArray(current.assignments)) {
    current.assignments = [];
    changed = true;
  }
  if (!Array.isArray(current.teachers)) {
    current.teachers = [];
    changed = true;
  }
  if (typeof current.familyName !== 'string') {
    current.familyName = '';
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
