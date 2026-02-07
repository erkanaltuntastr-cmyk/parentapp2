import { getActiveChild, deleteChild, updateChildGroupName } from '../usecases/children.js';
import { listSubjects, setSubjectActive } from '../usecases/subjects.js';
import { getState } from '../state/appState.js';
import { getIconById } from '../utils/icons.js';
import { getTeachersForChild } from '../usecases/teachers.js';
import { getActiveUser, ADMIN_USERNAME } from '../usecases/auth.js';
import { sendMessage } from '../usecases/messages.js';

function scoreColor(score){
  if (score === null || score === undefined) return '#E2E8F0';
  if (score >= 100) return '#22C55E';
  if (score >= 90) return '#86EFAC';
  if (score >= 80) return '#F97316';
  if (score >= 70) return '#FDBA74';
  if (score >= 50) return '#FACC15';
  if (score >= 30) return '#FEF08A';
  return '#7F1D1D';
}

export function ChildOverview(){
  const section = document.createElement('section');
  section.className = 'card';

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const name = (child.name || '').trim();
  const year = Number(child.year || 0);
  const school = (child.school || '').trim();
  const groupName = (child.groupName || '').trim();
  const icon = getIconById(child.iconId);

  const title = name || 'Your child';
  const metaLine = `${school || 'School not set'} | Year ${year || '-'} | `;
  const teachers = getTeachersForChild(child.id);

  section.innerHTML = `
    <div class="child-identity">
      <div class="child-identity-left">
        <div class="child-identity-icon"><img src="${icon.src}" alt="${icon.id}" /></div>
        <div class="child-identity-text">
          <div class="child-identity-name">${title}</div>
          <div class="child-identity-meta">
            <span>${metaLine}</span>
            <span class="group-edit">
              <span class="group-name ${groupName ? '' : 'is-empty'}">${groupName || 'Group Name'}</span>
              <button type="button" class="group-edit-btn" aria-label="Edit group name">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 16.5V20h3.5L18 9.5l-3.5-3.5L4 16.5Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
    ${teachers.length ? `
      <div class="teacher-strip">
        ${teachers.map(t => `<span class="teacher-chip">${t.name || 'Teacher'}</span>`).join('')}
      </div>
    ` : ''}
    <div class="overview-body"></div>
    <div class="actions" style="margin-top: var(--space-4);">
      <a class="button" href="#/subjects">View subjects</a>
      <div style="margin-top: var(--space-2);">
        <button type="button" class="button-secondary" data-role="suggest-subject">Suggest New Subject</button>
      </div>
      <div style="margin-top: var(--space-2);">
        <a class="button-secondary" href="#/add-child">Add another child</a>
      </div>
      <div style="margin-top: var(--space-1);">
        <a class="button-secondary" href="#/welcome">Back to welcome</a>
      </div>
      <div class="actions-row" style="margin-top: var(--space-3); justify-content:center;">
        <button type="button" class="button-secondary" data-role="edit-child">Edit Child</button>
        <button type="button" class="button-secondary" data-role="delete-child">Delete Child</button>
      </div>
    </div>
  `;

  const groupWrap = section.querySelector('.group-edit');
  const groupNameEl = groupWrap.querySelector('.group-name');
  const editBtn = groupWrap.querySelector('.group-edit-btn');
  const setGroupText = value => {
    const next = String(value || '').trim();
    groupNameEl.textContent = next || 'Group Name';
    groupNameEl.classList.toggle('is-empty', !next);
  };
  const startEdit = () => {
    groupWrap.innerHTML = `
      <input class="group-input" type="text" value="${groupName}" />
      <button type="button" class="group-save-btn" aria-label="Save group name">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    const input = groupWrap.querySelector('.group-input');
    const save = () => {
      updateChildGroupName(child.id, input.value);
      groupWrap.innerHTML = `
        <span class="group-name ${input.value.trim() ? '' : 'is-empty'}">${input.value.trim() || 'Group Name'}</span>
        <button type="button" class="group-edit-btn" aria-label="Edit group name">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 16.5V20h3.5L18 9.5l-3.5-3.5L4 16.5Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      `;
      groupWrap.querySelector('.group-edit-btn').addEventListener('click', startEdit);
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      }
    });
    input.addEventListener('blur', save);
    groupWrap.querySelector('.group-save-btn').addEventListener('click', save);
    input.focus();
  };
  editBtn.addEventListener('click', startEdit);

  const body = section.querySelector('.overview-body');
  const assignments = getState().assignments || [];
  const quizSessions = (getState().quizSessions || []).filter(s => s.childId === child.id && s.status === 'completed');

  const renderSubjects = () => {
    body.innerHTML = '';
    const subjects = listSubjects(child.id);
    const sorted = [...subjects].sort((a, b) => {
      if (a.active === b.active) return a.name.localeCompare(b.name);
      return a.active ? -1 : 1;
    });

    const cards = document.createElement('div');
    cards.className = 'overview-grid';
    if (!sorted.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<p class="subtitle">No subjects yet.</p>';
      body.appendChild(empty);
      return;
    }

    sorted.forEach((subject, idx) => {
      const scores = assignments
        .filter(a => a.childId === child.id && a.subject === subject.name && typeof a.score === 'number')
        .map(a => a.score);
      quizSessions
        .filter(s => s.subject === subject.name && typeof s.score === 'number')
        .forEach(s => scores.push(s.score));
      const best = scores.length ? Math.max(...scores) : null;
      const color = scoreColor(best);
      const card = document.createElement('div');
      card.className = `overview-card${subject.active ? '' : ' is-passive'}`;
      card.style.borderLeft = `4px solid ${color}`;
      card.innerHTML = `
        <div class="overview-card-head">
          <span>${subject.name}</span>
          <span class="score-badge" style="background:${color}">${best === null ? 'No data' : `${best}%`}</span>
        </div>
        <div class="help">Best score</div>
        <label class="subject-toggle">
          <span>${subject.active ? 'Active' : 'Passive'}</span>
          <input type="checkbox" ${subject.active ? 'checked' : ''} aria-label="Toggle subject active status" />
        </label>
      `;
      card.querySelector('input[type="checkbox"]').addEventListener('change', e => {
        setSubjectActive(child.id, subject.name, e.target.checked);
        renderSubjects();
      });
      cards.appendChild(card);
    });
    if (sorted.length % 2 === 1) {
      const last = cards.lastElementChild;
      if (last) last.classList.add('is-single');
    }
    body.appendChild(cards);
  };

  renderSubjects();

  section.querySelector('[data-role="edit-child"]').addEventListener('click', () => {
    alert('Edit child is coming next.');
  });
  section.querySelector('[data-role="delete-child"]').addEventListener('click', () => {
    const ok = confirm('Delete this child profile? This cannot be undone.');
    if (!ok) return;
    deleteChild(child.id);
    location.hash = '#/select-child';
  });

  const suggestBtn = section.querySelector('[data-role="suggest-subject"]');
  suggestBtn.addEventListener('click', () => {
    const idea = prompt('Suggest a new subject to add:');
    if (!idea) return;
    const user = getActiveUser();
    const from = user?.username || 'Parent';
    const message = `Subject suggestion for ${child.name || 'child'}: ${idea.trim()}`;
    sendMessage(from, ADMIN_USERNAME, message);
    alert('Thanks! Your suggestion was sent to Admin.');
  });

  return section;
}
