import { getState } from '../state/appState.js';
import { setActiveChild } from '../usecases/children.js';
import { getIconById } from '../utils/icons.js';
import { getFamilyName } from '../usecases/family.js';
import { getActiveUser } from '../usecases/auth.js';
import { listFamilyMembers, addFamilyMember } from '../usecases/familyMembers.js';
import { listTeachers, addTeacher } from '../usecases/teachers.js';

export function FamilyHub(){
  const section = document.createElement('section');
  section.className = 'card';

  const state = getState();
  const children = state.children || [];
  const activeUser = getActiveUser();
  const familyName = getFamilyName() || state.parent?.surname || state.parent?.name || 'Family';
  const title = `${String(familyName).toUpperCase()} FAMILY HUB`;
  const personIcon = `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="20" r="11" fill="currentColor"/>
      <rect x="18" y="34" width="28" height="18" rx="9" fill="currentColor" opacity="0.85"/>
      <rect x="22" y="38" width="20" height="10" rx="5" fill="currentColor" opacity="0.6"/>
    </svg>
  `;

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
      </div>
      <div class="family-list" data-role="parents-list"></div>
    `;
    body.appendChild(parentsSection);

    const parentsList = parentsSection.querySelector('[data-role="parents-list"]');
    const primaryName = state.parent?.name
      ? `${state.parent.name} ${state.parent.surname || ''}`.trim()
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
    const parentMarkup = parentCards.map(card => `
      <div class="family-card">
        <div class="family-person-head">
          <div class="family-avatar ${card.tone}">${personIcon}</div>
          <div class="family-card-title">${card.name}</div>
        </div>
        <div class="help">${card.relation}</div>
        ${card.meta ? `<div class="help">${card.meta}</div>` : ''}
      </div>
    `).join('');
    const inviteMarkup = `
      <div class="family-card is-clickable is-add" data-role="add-parent" role="button" tabindex="0">
        <div class="family-person-head">
          <div class="family-avatar neutral">+</div>
          <div class="family-card-title">Invite Parent</div>
        </div>
        <div class="help">Add another family member.</div>
      </div>
    `;
    parentsList.innerHTML = parentMarkup ? `${parentMarkup}${inviteMarkup}` : inviteMarkup;

    const addParent = () => {
      const name = prompt('Parent full name:');
      if (!name) return;
      const relation = prompt('Relation (e.g., Mother, Guardian, Grandparent):');
      addFamilyMember({ name, relation });
      render();
    };
    const addParentCard = parentsSection.querySelector('[data-role="add-parent"]');
    if (addParentCard) {
      addParentCard.addEventListener('click', addParent);
      addParentCard.addEventListener('keydown', e => {
        if (e.key === 'Enter') addParent();
      });
    }

    const teacherSection = document.createElement('div');
    teacherSection.className = 'family-section';
    teacherSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Teachers</h2>
      </div>
      <div class="family-list" data-role="teacher-list"></div>
    `;
    body.appendChild(teacherSection);

    let teachers = listTeachers();
    if (!teachers.length && children.length) {
      const amelia = children.find(c => String(c.name || '').toLowerCase() === 'amelia') || children[0];
      addTeacher({
        name: 'Mr Zaman',
        email: 'mr.zaman@oakwood.test',
        childIds: amelia ? [amelia.id] : [],
        subject: 'Maths'
      });
      teachers = listTeachers();
    }
    const teacherList = teacherSection.querySelector('[data-role="teacher-list"]');
    const teacherMarkup = teachers.length ? teachers.map(t => {
      const assigned = (t.childIds || []).map(id => {
        const child = children.find(c => c.id === id);
        return child?.name || 'Child';
      }).filter(Boolean);
      const subject = t.subject || 'Teacher';
      return `
        <div class="family-card">
          <div class="family-person-head">
            <div class="family-avatar green">${personIcon}</div>
            <div class="family-card-title">${t.name || 'Teacher'}</div>
          </div>
          <div class="help">${subject}${assigned.length ? ` for ${assigned.join(', ')}` : ''}</div>
          ${t.email ? `<div class="help">${t.email}</div>` : ''}
        </div>
      `;
    }).join('') : '<p class="help">No teachers linked yet.</p>';
    const inviteTeacherMarkup = `
      <div class="family-card is-clickable is-add" data-role="add-teacher" role="button" tabindex="0">
        <div class="family-person-head">
          <div class="family-avatar neutral">+</div>
          <div class="family-card-title">Invite Teacher</div>
        </div>
        <div class="help">Add a new teacher contact.</div>
      </div>
    `;
    teacherList.innerHTML = teachers.length ? `${teacherMarkup}${inviteTeacherMarkup}` : inviteTeacherMarkup;

    const addTeacherCard = teacherSection.querySelector('[data-role="add-teacher"]');
    if (addTeacherCard) {
      const addTeacherPrompt = () => {
        const name = prompt('Teacher name:');
        if (!name) return;
        const email = prompt('Teacher email (optional):') || '';
        const subject = prompt('Subject (optional):') || '';
        const assignRaw = prompt('Assign to which students? (comma-separated names, optional):') || '';
        const assignNames = assignRaw
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => s.toLowerCase());
        const childIds = assignNames.length
          ? children.filter(c => assignNames.includes(String(c.name || '').toLowerCase())).map(c => c.id)
          : [];
        addTeacher({ name, email, childIds, subject });
        render();
      };
      addTeacherCard.addEventListener('click', addTeacherPrompt);
      addTeacherCard.addEventListener('keydown', e => {
        if (e.key === 'Enter') addTeacherPrompt();
      });
    }

    const childSection = document.createElement('div');
    childSection.className = 'family-section';
    childSection.innerHTML = `
      <div class="family-section-head">
        <h2 class="h2">Students</h2>
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
      }).join('') + `
        <div class="family-card is-clickable is-add" data-role="add-child" role="button" tabindex="0">
          <div class="family-child-head">
            <div class="family-avatar neutral">+</div>
            <div class="family-card-title">Add Student</div>
          </div>
          <div class="help">Create a new pupil profile.</div>
        </div>
      `;
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
      const addCard = childList.querySelector('[data-role="add-child"]');
      if (addCard) {
        const open = () => { location.hash = '#/add-child'; };
        addCard.addEventListener('click', open);
        addCard.addEventListener('keydown', e => {
          if (e.key === 'Enter') open();
        });
      }
    }
  };

  render();

  return section;
}
