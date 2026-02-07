import { getState, saveState } from '../state/appState.js';

export function getParent(){
  const state = getState();
  return state.parent || null;
}

export function setParent(profile){
  const state = getState();
  const next = { ...state, parent: { ...profile } };
  saveState(next);
  return next.parent;
}
