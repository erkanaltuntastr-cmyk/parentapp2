import { getState } from '../state/appState.js';
import { getActiveChild, setActiveChild } from '../usecases/children.js';
import { getIconById } from '../utils/icons.js';

export function FamilyHub(){
  const section = document.createElement('section');
  section.className = 'card';

  const state = getState();
  const children = state.children || [];
  const active = getActiveChild();

  section.innerHTML = `
    <h1 class="h1">Family Hub</h1>
    <p class="subtitle">Manage learning plans and launch quizzes in one place.</p>
    <div class="family-body"></div>
  `;

  const body = section.querySelector('.family-body');

  if (!children.length) {
    body.innerHTML = `
      <div class="empty-state">
        <p class="subtitle">No children added yet.</p>
        <a class="button" href="#/add-child">Add a child</a>
      </div>
    `;
    return section;
  }

  const grid = document.createElement('div');
  grid.className = 'child-grid';
  children.forEach(child => {
    const icon = getIconById(child.iconId);
    const card = document.createElement('div');
    card.className = `child-card is-clickable${active?.id === child.id ? ' is-selected' : ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <div class="child-icon"><img src="${icon.src}" alt="${icon.id}" /></div>
      <div class="child-title">${child.name || 'Unnamed Child'}</div>
      <div class="child-meta">${child.school || 'School not set'}</div>
      <div class="child-age">Year ${child.year || '-'}</div>
    `;
    const select = () => {
      setActiveChild(child.id);
      location.hash = '#/child-overview';
    };
    card.addEventListener('click', select);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter') select();
    });
    grid.appendChild(card);
  });
  body.appendChild(grid);

  if (active) {
    const quick = document.createElement('div');
    quick.className = 'family-actions';
    quick.innerHTML = `
      <h2 class="h2">Quick Actions for ${active.name || 'Child'}</h2>
      <div class="actions-row">
        <a class="button" href="#/quiz-wizard">Create Quiz</a>
        <a class="button-secondary" href="#/manual-quiz">Manual Quiz</a>
        <a class="button-secondary" href="#/subjects">Subject Curriculum</a>
        <a class="button-secondary" href="#/child-overview">Pupil Overview</a>
      </div>
    `;
    body.appendChild(quick);
  }

  return section;
}
