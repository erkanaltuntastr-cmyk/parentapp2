import { getItem, setItem } from './storage.js';

const initialState = {
  __meta: { version: 1 },
  users: [],
  activeUserId: null,
  children: [],
  activeChildId: null,
  pin: null
};

let state = null;

function clone(obj){
  return JSON.parse(JSON.stringify(obj));
}

export function loadState(){
  if (state) return state;
  const stored = getItem();
  state = stored && stored.__meta && stored.__meta.version === 1
    ? stored
    : clone(initialState);
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
