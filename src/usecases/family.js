import { getState, saveState } from '../state/appState.js';

export function getFamilyName(){
  const state = getState();
  return state.familyName || '';
}

export function setFamilyName(name){
  const state = getState();
  const familyName = String(name || '').trim();
  saveState({ ...state, familyName });
}
