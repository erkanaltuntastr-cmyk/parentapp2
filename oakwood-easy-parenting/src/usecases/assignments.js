import { getState, saveState } from '../state/appState.js';

export function listAssignments(childId, status){
  const state = getState();
  const list = Array.isArray(state.assignments) ? state.assignments : [];
  const byChild = list.filter(a => a.childId === childId);
  if (!status) return byChild;
  return byChild.filter(a => a.status === status);
}

export function getAssignmentById(id){
  const state = getState();
  const list = Array.isArray(state.assignments) ? state.assignments : [];
  return list.find(a => a.id === id) || null;
}

export function addAssignment(data){
  const state = getState();
  const assignment = {
    id: `a_${Date.now()}`,
    status: 'pending',
    assignedAt: new Date().toISOString(),
    ...data
  };
  const next = { ...state, assignments: [...(state.assignments || []), assignment] };
  saveState(next);
  return assignment.id;
}

export function completeAssignment(id, score){
  const state = getState();
  const assignments = (state.assignments || []).map(a => {
    if (a.id !== id) return a;
    return { ...a, status: 'completed', score, completedAt: new Date().toISOString() };
  });
  saveState({ ...state, assignments });
}
