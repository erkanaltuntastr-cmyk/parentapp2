import { getState, saveState } from '../state/appState.js';
import { hashPassword } from './auth.js';

const DEMO_PASSWORD = 'Oakwood*2026';
const DEMO_PARENT_USERNAME = 'demo_parent';

function normalise(value){
  return String(value || '').trim().toLowerCase();
}

function makeUniqueId(prefix, taken){
  let candidate = prefix;
  let counter = 1;
  while (taken.has(candidate)) {
    candidate = `${prefix}_${counter}`;
    counter += 1;
  }
  taken.add(candidate);
  return candidate;
}

function makeUniqueUsername(base, users){
  let candidate = base;
  let counter = 1;
  while (users.some(u => normalise(u.username) === normalise(candidate))) {
    candidate = `${base}${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function ensureDemoSeed(){
  const state = getState();
  const hasData = (state.users && state.users.length) || (state.children && state.children.length);
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const nowIso = new Date().toISOString();

  let users = [...state.users];
  let children = [...state.children];
  let teachers = [...state.teachers];
  let changed = false;

  const userIds = new Set(users.map(u => u.id));
  const childIds = new Set(children.map(c => c.id));
  const teacherIds = new Set(teachers.map(t => t.id));

  const findUser = username => users.find(u => normalise(u.username) === normalise(username));

  let parentUser = findUser(DEMO_PARENT_USERNAME);
  let parentId = parentUser?.id;
  if (!parentUser) {
    parentId = makeUniqueId('u_demo_parent', userIds);
    users = [
      ...users,
      {
        id: parentId,
        username: DEMO_PARENT_USERNAME,
        passwordHash,
        consentGiven: true,
        profile: { name: 'Jamie', surname: 'Oakwood' },
        isDemo: true
      }
    ];
    changed = true;
  }

  const demoChildren = [
    {
      key: 'amelia',
      name: 'Amelia',
      dob: '14/03/2015',
      school: 'Oakwood Primary',
      year: 5,
      gender: 'female',
      iconId: 'owl',
      notes: 'Confident reader, building confidence in fractions.',
      studentUsername: 'amelia5',
      subjects: [
        { name: 'Mathematics', active: true },
        { name: 'English', active: true },
        { name: 'Science', active: false }
      ]
    },
    {
      key: 'oliver',
      name: 'Oliver',
      dob: '21/11/2013',
      school: 'Oakwood Academy',
      year: 7,
      gender: 'male',
      iconId: 'fox',
      notes: 'Enjoys experiments, needs support with algebra.',
      studentUsername: 'oliver7',
      subjects: [
        { name: 'Mathematics', active: true },
        { name: 'Science', active: true },
        { name: 'English', active: false }
      ]
    }
  ];

  const hasDemoChildren = parentId && children.some(c => c.userId === parentId);
  if (parentId && !hasDemoChildren) {
    demoChildren.forEach(entry => {
      const childId = makeUniqueId(`c_demo_${entry.key}`, childIds);
      const existingStudent = findUser(entry.studentUsername);
      const studentUsername = existingStudent
        ? makeUniqueUsername(entry.studentUsername, users)
        : entry.studentUsername;
      const studentUserId = makeUniqueId(`u_demo_${entry.key}`, userIds);
      users = [
        ...users,
        {
          id: studentUserId,
          username: studentUsername,
          passwordHash,
          role: 'child',
          childId,
          isDemo: true
        }
      ];
      children = [
        ...children,
        {
          id: childId,
          name: entry.name,
          dob: entry.dob,
          school: entry.school,
          year: entry.year,
          gender: entry.gender,
          iconId: entry.iconId,
          notes: entry.notes,
          userId: parentId,
          studentUserId,
          subjects: entry.subjects.map(subject => ({ ...subject, addedAt: nowIso })),
          isDemo: true
        }
      ];
    });
    const teacherId = makeUniqueId('t_demo_zaman', teacherIds);
    teachers = [
      ...teachers,
      {
        id: teacherId,
        name: 'Mr Zaman',
        email: 'mr.zaman@oakwood.test',
        childIds: children.filter(c => c.userId === parentId).map(c => c.id),
        subject: 'Maths'
      }
    ];
    changed = true;
  }

  if (!changed && state.__meta?.demoSeeded) return;

  const next = {
    ...state,
    ...(hasData ? {} : { familyName: 'Blackwood' }),
    users,
    children,
    teachers,
    parent: state.parent || { name: 'Jamie', surname: 'Oakwood', postcode: 'NW1 4AB' },
    ...(hasData ? {} : { activeUserId: parentId, activeChildId: children[0]?.id || null }),
    __meta: { ...(state.__meta || {}), demoSeeded: true }
  };
  saveState(next);
}
