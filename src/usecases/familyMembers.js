import { getState, saveState } from '../state/appState.js';

export function listFamilyMembers(){
  const state = getState();
  return Array.isArray(state.familyMembers) ? state.familyMembers : [];
}

export function addFamilyMember({ name, relation }){
  const state = getState();
  const member = {
    id: `f_${Date.now()}`,
    name: String(name || '').trim(),
    relation: String(relation || '').trim(),
    addedAt: new Date().toISOString()
  };
  if (!member.name) return null;
  const next = { ...state, familyMembers: [...(state.familyMembers || []), member] };
  saveState(next);
  return member.id;
}
