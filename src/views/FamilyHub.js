import { getState } from '../state/appState.js';
import { setActiveChild } from '../usecases/children.js';
import { getIconById } from '../utils/icons.js';
import { getFamilyName } from '../usecases/family.js';
import { getActiveUser } from '../usecases/auth.js';
import { listFamilyMembers, addFamilyMember } from '../usecases/familyMembers.js';
import { listTeachers } from '../usecases/teachers.js';

export function FamilyHub(){
  const section = document.createElement('section');
  section.className = 'card';

  const state = getState();
  const children = state.children || [];
  const activeUser = getActiveUser();
  const familyName = getFamilyName() || state.parent?.surname || state.parent?.name || 'Family';
  const title = `${String(familyName).toUpperCase()} FAMILY HUB`;

  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    <p class="subtitle">Your family workspace for parents, teachers, and pupils.</p>
    <div class="family-body"></div>
  `;

  const body = section.querySelector('.family-body');

  const render = () => {
    body.innerHTML = '';

    const parentsSection = document.createElement('div');
    parentsSection.className = 'family-section';
    parentsSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Parents</h2>
        <button type="button" class="button-secondary" data-role="add-parent">Invite Parent</button>
      </div>
      <div class="family-list" data-role="parents-list"></div>
    `;
    body.appendChild(parentsSection);

    const parentsList = parentsSection.querySelector('[data-role="parents-list"]');
    const primaryName = state.parent?.name
      ? `${state.parent.name} ${state.parent.surname || ''}`.trim()
      : (activeUser?.username || 'Parent');
    const parentCards = [
      {
        id: 'primary',
        name: primaryName,
        relation: 'Primary Parent',
        meta: activeUser?.username || ''
      },
      ...listFamilyMembers().map(m => ({
        id: m.id,
        name: m.name,
        relation: m.relation || 'Parent',
        meta: m.addedAt ? `Invited ${new Date(m.addedAt).toLocaleDateString('en-GB')}` : ''
      }))
    ];
    parentsList.innerHTML = parentCards.map(card => `
      <div class="family-card">
        <div class="family-card-title">${card.name}</div>
        <div class="help">${card.relation}</div>
        ${card.meta ? `<div class="help">${card.meta}</div>` : ''}
      </div>
    `).join('') || '<p class="help">No parents listed yet.</p>';

    parentsSection.querySelector('[data-role="add-parent"]').addEventListener('click', () => {
      const name = prompt('Parent full name:');
      if (!name) return;
      const relation = prompt('Relation (e.g., Mother, Guardian, Grandparent):');
      addFamilyMember({ name, relation });
      render();
    });

    const teacherSection = document.createElement('div');
    teacherSection.className = 'family-section';
    teacherSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Teachers</h2>
      </div>
      <div class="family-list" data-role="teacher-list"></div>
    `;
    body.appendChild(teacherSection);

    const teachers = listTeachers();
    const teacherList = teacherSection.querySelector('[data-role="teacher-list"]');
    teacherList.innerHTML = teachers.length ? teachers.map(t => {
      const assigned = (t.childIds || []).map(id => {
        const child = children.find(c => c.id === id);
        return child?.name || 'Child';
      }).filter(Boolean);
      const subject = t.subject || 'Teacher';
      return `
        <div class="family-card">
          <div class="family-card-title">${t.name || 'Teacher'}</div>
          <div class="help">${subject}${assigned.length ? ` for ${assigned.join(', ')}` : ''}</div>
          ${t.email ? `<div class="help">${t.email}</div>` : ''}
        </div>
      `;
    }).join('') : '<p class="help">No teachers linked yet.</p>';

    const childSection = document.createElement('div');
    childSection.className = 'family-section';
    childSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Children</h2>
      </div>
      <div class="family-list" data-role="child-list"></div>
    `;
    body.appendChild(childSection);

    const childList = childSection.querySelector('[data-role="child-list"]');
    if (!children.length) {
      childList.innerHTML = '<p class="help">No children added yet.</p>';
    } else {
      childList.innerHTML = children.map(child => {
        const icon = getIconById(child.iconId);
        return `
          <div class="family-card is-clickable" data-child="${child.id}" role="button" tabindex="0">
            <div class="family-child-head">
              <div class="child-icon"><img src="${icon.src}" alt="${icon.id}" /></div>
              <div class="family-card-title">${child.name || 'Unnamed Child'}</div>
            </div>
            <div class="help">${child.school || 'School not set'}</div>
            <div class="help">Year ${child.year || '-'}</div>
          </div>
        `;
      }).join('');
      childList.querySelectorAll('[data-child]').forEach(card => {
        const select = () => {
          const id = card.getAttribute('data-child');
          if (!id) return;
          setActiveChild(id);
          location.hash = '#/child-overview';
        };
        card.addEventListener('click', select);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter') select();
        });
      });
    }

    const addWrap = document.createElement('div');
    addWrap.className = 'family-add-child';
    addWrap.innerHTML = `
      <div>
        <div class="family-card-title">Add another child</div>
        <div class="help">Create a new pupil profile.</div>
      </div>
      <a class="button" href="#/add-child">Add Child</a>
    `;
    body.appendChild(addWrap);
  };

  render();

  return section;
}
