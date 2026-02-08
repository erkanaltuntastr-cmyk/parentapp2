import { getState } from '../state/appState.js';
import { setActiveChild } from '../usecases/children.js';
import { getDetailedAge } from '../utils/date.js';
import { getIconById } from '../utils/icons.js';
import { listAssignments } from '../usecases/assignments.js';
import { getFamilyName } from '../usecases/family.js';

export function SelectChild(){
  const section = document.createElement('section');
  section.className = 'card';

  const familyName = getFamilyName();
  const title = familyName ? `${familyName} Family` : 'Family Tree';
  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    <p class="subtitle">Manage your family profiles in one place.</p>
    <div class="family-tree"></div>
  `;

  const tree = section.querySelector('.family-tree');
  const render = () => {
    const state = getState();
    const children = state.children || [];
    const parent = state.parent;
    tree.innerHTML = '';

    const parentWrap = document.createElement('div');
    parentWrap.className = 'parent-section';
    if (parent) {
      const initials = `${(parent.name || 'P')[0] || 'P'}${(parent.surname || '')[0] || ''}`.toUpperCase();
      parentWrap.innerHTML = `
        <div class="parent-card">
          <div class="parent-avatar">${initials}</div>
          <div class="parent-info">
            <div class="parent-name">${parent.name || 'Parent'} ${parent.surname || ''}</div>
            <div class="parent-role">Parent</div>
          </div>
        </div>
      `;
    } else {
      parentWrap.innerHTML = `
        <div class="parent-card">
          <div class="parent-avatar">P</div>
          <div class="parent-info">
            <div class="parent-name">Parent Profile</div>
            <div class="parent-role">Complete setup in Add Student</div>
          </div>
        </div>
      `;
    }
    tree.appendChild(parentWrap);

    const connector = document.createElement('div');
    connector.className = 'tree-connector';
    tree.appendChild(connector);

    const childSection = document.createElement('div');
    childSection.className = 'children-section';
    childSection.innerHTML = `<h2 class="h2">Your Students</h2>`;
    const grid = document.createElement('div');
    grid.className = 'child-grid';

    if (!children.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <p class="subtitle">Welcome! Let's add your first student.</p>
        <a class="button" href="#/add-child">Add a student</a>
      `;
      childSection.appendChild(empty);
    } else {
      children.forEach(child => {
        const card = document.createElement('div');
        card.className = 'child-card is-clickable';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        const icon = getIconById(child.iconId);
        const age = getDetailedAge(child.dob);
        const pendingCount = listAssignments(child.id, 'pending').length;

        card.innerHTML = `
          <div class="child-icon"><img src="${icon.src}" alt="${icon.id}" /></div>
          <div class="child-title">
            ${child.name || 'Unnamed Student'}
            ${pendingCount ? `<span class="task-badge">${pendingCount} Tasks Pending</span>` : ''}
          </div>
          ${age ? `<div class="child-age">${age}</div>` : ''}
          <div class="child-meta">${child.school || 'School not set'}</div>
        `;

        const open = () => {
          setActiveChild(child.id);
          location.hash = '#/child-overview';
        };
        card.addEventListener('click', open);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        });
        grid.appendChild(card);
      });

      childSection.appendChild(grid);
    }

    const addButton = document.createElement('a');
    addButton.className = 'button full-width';
    addButton.href = '#/add-child';
    addButton.textContent = 'Add Student';
    childSection.appendChild(addButton);
    tree.appendChild(childSection);
  };

  render();
  return section;
}
