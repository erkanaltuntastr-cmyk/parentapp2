import { getActiveChild, deleteChild, updateChildGroupName } from '../usecases/children.js';
import { addSubject, listSubjects, setSubjectActive } from '../usecases/subjects.js';
import { getState } from '../state/appState.js';
import { getIconById } from '../utils/icons.js';
import { getTeachersForChild } from '../usecases/teachers.js';
import { listFamilyMembers } from '../usecases/familyMembers.js';
import { getActiveUser, ADMIN_USERNAME } from '../usecases/auth.js';
import { sendMessage } from '../usecases/messages.js';
import { getAvailableSubjects } from '../usecases/curriculum.js';

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
  const personIcon = `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="20" r="11" fill="currentColor"/>
      <rect x="18" y="34" width="28" height="18" rx="9" fill="currentColor" opacity="0.85"/>
      <rect x="22" y="38" width="20" height="10" rx="5" fill="currentColor" opacity="0.6"/>
    </svg>
  `;
  const infoIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="12" y1="10" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="7" r="1.2" fill="currentColor"/>
    </svg>
  `;

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
  const activeUser = getActiveUser();

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
    <div class="overview-body"></div>
    <div class="actions" style="margin-top: var(--space-4);">
      <div>
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

  const renderSections = async () => {
    body.innerHTML = '';
    const teachers = getTeachersForChild(child.id);
    const primaryName = getState().parent?.name
      ? `${getState().parent.name} ${getState().parent.surname || ''}`.trim()
      : (activeUser?.username || 'Parent');
    const primaryMeta = activeUser?.username || '';
    const parentCards = [
      {
        id: 'primary',
        name: primaryName,
        relation: 'Primary Parent',
        meta: primaryMeta,
        tone: 'gold'
      },
      ...listFamilyMembers().map(m => ({
        id: m.id,
        name: m.name,
        relation: m.relation || 'Parent',
        meta: m.addedAt ? `Invited ${new Date(m.addedAt).toLocaleDateString('en-GB')}` : '',
        tone: 'orange'
      }))
    ];

    const parentsSection = document.createElement('div');
    parentsSection.className = 'family-section';
    parentsSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Parents</h2>
      </div>
      <div class="family-list" data-role="parents-list"></div>
    `;
    const parentsList = parentsSection.querySelector('[data-role="parents-list"]');
    parentsList.innerHTML = parentCards.length ? parentCards.map(card => `
      <div class="family-card">
        <div class="family-person-head">
          <div class="family-avatar ${card.tone}">${personIcon}</div>
          <div class="family-card-title">${card.name}</div>
        </div>
        <div class="help">${card.relation}</div>
        ${card.meta ? `<div class="help">${card.meta}</div>` : ''}
      </div>
    `).join('') : '<p class="help">No parents listed yet.</p>';
    body.appendChild(parentsSection);

    const teacherSection = document.createElement('div');
    teacherSection.className = 'family-section';
    teacherSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Teachers</h2>
      </div>
      <div class="family-list" data-role="teacher-list"></div>
    `;
    const teacherList = teacherSection.querySelector('[data-role="teacher-list"]');
    teacherList.innerHTML = teachers.length ? teachers.map(t => {
      const subject = t.subject || 'Teacher';
      return `
        <div class="family-card">
          <div class="family-person-head">
            <div class="family-avatar green">${personIcon}</div>
            <div class="family-card-title">${t.name || 'Teacher'}</div>
          </div>
          <div class="help">${subject}</div>
          ${t.email ? `<div class="help">${t.email}</div>` : ''}
        </div>
      `;
    }).join('') : '<p class="help">No teachers linked yet.</p>';
    body.appendChild(teacherSection);

    const subjectSection = document.createElement('div');
    subjectSection.className = 'family-section';
    subjectSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Lessons</h2>
      </div>
      <div class="family-list" data-role="subject-list"></div>
    `;
    const subjectList = subjectSection.querySelector('[data-role="subject-list"]');
    subjectList.innerHTML = '<p class="help">Loading lessons...</p>';
    body.appendChild(subjectSection);

    const available = await getAvailableSubjects(child.year);
    const stored = listSubjects(child.id);
    const storedMap = new Map(stored.map(s => [s.name.toLowerCase(), s]));
    const sortedNames = [...available].sort((a, b) => a.localeCompare(b));

    if (!sortedNames.length) {
      subjectList.innerHTML = '<p class="help">No lessons found for this year in the curriculum file.</p>';
      return;
    }

    subjectList.innerHTML = sortedNames.map(name => {
      const key = String(name || '').toLowerCase();
      const entry = storedMap.get(key);
      const isActive = entry ? entry.active : false;
      const scores = assignments
        .filter(a => a.childId === child.id && a.subject === name && typeof a.score === 'number')
        .map(a => a.score);
      quizSessions
        .filter(s => s.subject === name && typeof s.score === 'number')
        .forEach(s => scores.push(s.score));
      const best = scores.length ? Math.max(...scores) : null;
      const color = scoreColor(best);
      return `
        <div class="family-card${isActive ? '' : ' is-passive'}" style="border-left:4px solid ${color}">
          <div class="family-person-head">
            <div class="family-avatar info">${infoIcon}</div>
            <div class="family-card-title">${name}</div>
          </div>
          <div class="help">Best score: ${best === null ? 'No data' : `${best}%`}</div>
          <label class="subject-toggle">
            <span>${isActive ? 'Active' : 'Passive'}</span>
            <input type="checkbox" data-subject="${name}" ${isActive ? 'checked' : ''} aria-label="Toggle subject active status" />
          </label>
        </div>
      `;
    }).join('');

    subjectList.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', e => {
        const subjectName = e.target.getAttribute('data-subject') || '';
        if (!subjectName) return;
        if (e.target.checked) {
          addSubject(child.id, subjectName, true);
        } else {
          setSubjectActive(child.id, subjectName, false);
        }
        renderSections();
      });
    });
  };

  renderSections();

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
