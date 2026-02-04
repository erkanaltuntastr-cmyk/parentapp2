import { getState, saveState } from '../state/appState.js';

export function addChild(childData){
  const state = getState();
  const id = `c_${Date.now()}`;
  const child = { id, ...childData };
  const next = {
    ...state,
    children: [...state.children, child],
    activeChildId: id
  };
  saveState(next);
  return id;
}

export function setActiveChild(childId){
  const state = getState();
  const next = { ...state, activeChildId: childId };
  saveState(next);
}

export function getActiveChild(){
  const state = getState();
  const id = state.activeChildId;
  if (!id) return null;
  return state.children.find(c => c.id === id) || null;
}
