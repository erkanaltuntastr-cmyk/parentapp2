import { getState } from '../state/appState.js';
import { setActiveChild } from '../usecases/children.js';
import { getDetailedAge } from '../utils/date.js';
import { getIconById } from '../utils/icons.js';
import { listAssignments } from '../usecases/assignments.js';
import { getFamilyName } from '../usecases/family.js';

// Title Case / Proper Font helper
function toProperCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SelectChild(){
  const section = document.createElement('section');
  section.className = 'card';

  const familyName = toProperCase(getFamilyName());
  const title = familyName ? `${familyName} Family` : 'Family Tree';
  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    <p class="subtitle">Manage Your Family Profiles In One Place.</p>
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
      const parentName = toProperCase(`${parent.name || 'Parent'} ${parent.surname || ''}`);
      parentWrap.innerHTML = `
        <div class="parent-card">
          <div class="parent-avatar">${initials}</div>
          <div class="parent-info">
            <div class="parent-name">${parentName}</div>
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
            <div class="parent-role">Complete Setup In Add Student</div>
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
        <p class="subtitle">Welcome! Let's Add Your First Student.</p>
        <a class="button" href="#/add-child">Add A Student</a>
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
        const childName = toProperCase(child.name || 'Unnamed Student');
        const childSchool = toProperCase(child.school || 'School Not Set');

        card.innerHTML = `
          <div class="child-card-header">
            <div class="child-card-avatar">
              <img src="${icon.src}" alt="${icon.id}" />
            </div>
            <div class="child-card-info">
              <div class="child-card-name">${childName}</div>
              ${pendingCount ? `<span class="child-card-pending">${pendingCount} Tasks Pending</span>` : ''}
            </div>
          </div>
          <div class="child-card-meta">
            ${age ? `<div>${age}</div>` : ''}
            <div>${childSchool}</div>
          </div>
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
    addButton.textContent = 'Add A Student';
    childSection.appendChild(addButton);
    tree.appendChild(childSection);
  };

  render();
  return section;
}
