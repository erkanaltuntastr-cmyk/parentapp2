import { getState, saveState } from '../state/appState.js';
import { hashPassword } from './auth.js';

export async function ensureDemoSeed(){
  const state = getState();
  if (state.__meta?.demoSeeded) return;
  const hasData = (state.users && state.users.length) || (state.children && state.children.length);
  if (hasData) {
    saveState({ ...state, __meta: { ...(state.__meta || {}), demoSeeded: true } });
    return;
  }

  const now = Date.now();
  const passwordHash = await hashPassword('Oakwood*2026');
  const parentId = `u_${now}`;
  const child1Id = `c_${now + 1}`;
  const child2Id = `c_${now + 2}`;
  const childUser1Id = `u_${now + 3}`;
  const childUser2Id = `u_${now + 4}`;

  const users = [
    {
      id: parentId,
      username: 'demo_parent',
      passwordHash,
      consentGiven: true,
      profile: { name: 'Jamie', surname: 'Oakwood' }
    },
    { id: childUser1Id, username: 'amelia5', passwordHash, role: 'child', childId: child1Id },
    { id: childUser2Id, username: 'oliver7', passwordHash, role: 'child', childId: child2Id }
  ];

  const children = [
    {
      id: child1Id,
      name: 'Amelia',
      dob: '14/03/2015',
      school: 'Oakwood Primary',
      year: 5,
      gender: 'female',
      iconId: 'owl',
      notes: 'Confident reader, building confidence in fractions.',
      userId: parentId,
      studentUserId: childUser1Id,
      subjects: [
        { name: 'Mathematics', active: true, addedAt: new Date().toISOString() },
        { name: 'English', active: true, addedAt: new Date().toISOString() },
        { name: 'Science', active: false, addedAt: new Date().toISOString() }
      ]
    },
    {
      id: child2Id,
      name: 'Oliver',
      dob: '21/11/2013',
      school: 'Oakwood Academy',
      year: 7,
      gender: 'male',
      iconId: 'fox',
      notes: 'Enjoys experiments, needs support with algebra.',
      userId: parentId,
      studentUserId: childUser2Id,
      subjects: [
        { name: 'Mathematics', active: true, addedAt: new Date().toISOString() },
        { name: 'Science', active: true, addedAt: new Date().toISOString() },
        { name: 'English', active: false, addedAt: new Date().toISOString() }
      ]
    }
  ];

  const next = {
    ...state,
    users,
    children,
    activeUserId: parentId,
    activeChildId: child1Id,
    parent: { name: 'Jamie', surname: 'Oakwood', postcode: 'NW1 4AB' },
    __meta: { ...(state.__meta || {}), demoSeeded: true }
  };
  saveState(next);
}
