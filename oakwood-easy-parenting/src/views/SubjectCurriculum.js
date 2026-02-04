import { getActiveChild } from '../usecases/children.js';
import { addSubject, listSubjects } from '../usecases/subjects.js';
import { getAvailableSubjects, getTopics, loadCurriculum } from '../usecases/curriculum.js';
import { addAssignment } from '../usecases/assignments.js';

function getCurrentSchoolWeek(){
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(startYear, 8, 1);
  start.setHours(0, 0, 0, 0);
  const diff = now.getTime() - start.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, week);
}

function parseWeekStart(estimatedWeek){
  const m = String(estimatedWeek || '').match(/\d+/);
  return m ? Number(m[0]) : null;
}

export function SubjectCurriculum(){
  const section = document.createElement('section');
  section.className = 'card';

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const name = (child.name || '').trim();
  const title = name ? `${name} - curriculum` : 'Your child - curriculum';

  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    <p class="subtitle">Select a subject to view topics for the current school week.</p>
    <div class="curriculum-body"></div>
    <div class="actions" style="margin-top: var(--space-4);">
      <a class="button-secondary" href="#/child-overview">Back to overview</a>
      <div style="margin-top: var(--space-1);">
        <a class="button-secondary" href="#/select-child">Family Tree</a>
      </div>
    </div>
  `;

  const body = section.querySelector('.curriculum-body');
  const year = child.year;
  let available = [];
  let selected = '';
  let topics = [];
  let showSubtopics = false;
  let modalOpen = false;

  const render = () => {
    body.innerHTML = '';

    const boxWrap = document.createElement('div');
    boxWrap.className = 'subject-boxes';
    available.forEach(sub => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `subject-box${sub === selected ? ' is-selected' : ''}`;
      btn.textContent = sub;
      btn.addEventListener('click', async () => {
        selected = sub;
        topics = await getTopics(year, sub);
        render();
      });
      boxWrap.appendChild(btn);
    });
    body.appendChild(boxWrap);

    if (!selected) return;

    const added = listSubjects(child.id);
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'button';
    addBtn.textContent = added.includes(selected) ? 'Subject Added' : 'Add Subject';
    addBtn.disabled = added.includes(selected);
    addBtn.addEventListener('click', () => {
      addSubject(child.id, selected);
      render();
    });
    body.appendChild(addBtn);

    const toggle = document.createElement('label');
    toggle.className = 'toggle';
    toggle.innerHTML = `
      <input type="checkbox" ${showSubtopics ? 'checked' : ''} />
      <span>Show Subtopics</span>
    `;
    toggle.querySelector('input').addEventListener('change', e => {
      showSubtopics = e.target.checked;
      section.querySelectorAll('.subtopics').forEach(el => {
        el.classList.toggle('is-open', showSubtopics);
        el.classList.toggle('is-closed', !showSubtopics);
      });
    });
    body.appendChild(toggle);

    const week = getCurrentSchoolWeek();
    const list = document.createElement('div');
    list.className = 'topic-list';
    topics.forEach(t => {
      const startWeek = parseWeekStart(t.estimatedWeek);
      const isPast = startWeek !== null && startWeek < week;
      const row = document.createElement('div');
      row.className = `topic-row ${isPast ? 'past-topic' : 'future-topic'}`;
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = true;
      const title = document.createElement('div');
      title.textContent = t.mainTopic || t.subject;
      row.appendChild(check);
      row.appendChild(title);

      const assignBtn = document.createElement('button');
      assignBtn.type = 'button';
      assignBtn.className = 'button-secondary assign-btn';
      assignBtn.textContent = 'Assign Task';
      assignBtn.addEventListener('click', () => {
        if (modalOpen) return;
        modalOpen = true;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
          <div class="modal">
            <h3 class="h3">Assign Task</h3>
            <p class="help">Assign this topic as homework or an exam.</p>
            <form class="form">
              <div class="field">
                <label for="taskType">Type</label>
                <select id="taskType" name="taskType">
                  <option value="homework">Homework</option>
                  <option value="exam">Exam</option>
                </select>
              </div>
              <div class="field">
                <label for="taskDeadline">Deadline</label>
                <input id="taskDeadline" name="taskDeadline" type="date" required />
              </div>
              <div class="actions-row">
                <button type="submit" class="button">Assign</button>
                <button type="button" class="button-secondary" data-role="cancel">Cancel</button>
              </div>
            </form>
          </div>
        `;
        const close = () => {
          overlay.remove();
          modalOpen = false;
        };
        overlay.querySelector('[data-role="cancel"]').addEventListener('click', close);
        overlay.addEventListener('click', e => {
          if (e.target === overlay) close();
        });
        overlay.querySelector('form').addEventListener('submit', e => {
          e.preventDefault();
          const type = overlay.querySelector('#taskType').value;
          const deadline = overlay.querySelector('#taskDeadline').value;
          addAssignment({
            childId: child.id,
            subject: selected,
            topic: t.mainTopic || t.subject,
            subtopic: t.subtopic || '',
            estimatedWeek: t.estimatedWeek || '',
            type,
            deadline
          });
          close();
          alert('Task assigned.');
        });
        section.appendChild(overlay);
      });
      row.appendChild(assignBtn);

      const subText = (t.subtopic || '').trim();
      const weekText = t.estimatedWeek ? `Estimated Week: ${t.estimatedWeek}` : '';
      if (subText || weekText) {
        const subWrap = document.createElement('div');
        subWrap.className = `subtopics ${showSubtopics ? 'is-open' : 'is-closed'}`;
        if (subText) {
          const sub = document.createElement('div');
          sub.className = 'help';
          sub.textContent = subText;
          subWrap.appendChild(sub);
        }
        if (weekText) {
          const weekLabel = document.createElement('div');
          weekLabel.className = 'help';
          weekLabel.textContent = weekText;
          subWrap.appendChild(weekLabel);
        }
        row.appendChild(subWrap);
      }
      list.appendChild(row);
    });
    body.appendChild(list);
  };

  const init = async () => {
    body.innerHTML = '<p class="subtitle">Loading curriculum...</p>';
    await loadCurriculum();
    available = await getAvailableSubjects(year);
    if (!available.length) {
      body.innerHTML = '<p class="subtitle">No subjects found for this year.</p>';
      return;
    }
    render();
  };

  init();
  return section;
}
