import { getActiveChild } from '../usecases/children.js';
import { listSubjects, listSubjectNames, addSubject, removeSubject } from '../usecases/subjects.js';
import { getAvailableSubjects, getTopics, loadCurriculum } from '../usecases/curriculum.js';

function toProperCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Subjects(){
  const section = document.createElement('section');
  section.className = 'card';

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const name = (child.name || '').trim();
  const title = name ? `${name} - Subjects` : 'Your Student - Subjects';

  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    <p class="subtitle">Start By Adding The Subjects Your Student Studies.</p>
    <div class="subjects-body"></div>
    <div class="actions" style="margin-top: var(--space-4);">
      <a class="button-secondary" href="#/child-overview">Back To Overview</a>
      <div style="margin-top: var(--space-1);">
        <a class="button-secondary" href="#/add-child">Add Another Student</a>
      </div>
    </div>
  `;

  const body = section.querySelector('.subjects-body');
  const childId = child.id;
  const year = child.year;
  let availableSubjects = [];
  let selectedSubject = '';
  let topics = [];

  const render = () => {
    body.innerHTML = '';

    const added = listSubjects(childId);
    const addedNames = added.map(s => s.name);
    if (!addedNames.length) {
      const empty = document.createElement('p');
      empty.className = 'subtitle';
      empty.textContent = 'No Subjects Yet.';
      body.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'subject-list';
      addedNames.forEach(item => {
        const row = document.createElement('div');
        row.className = 'subject-row';
        
        const content = document.createElement('div');
        content.className = 'subject-row-content';
        
        const label = document.createElement('span');
        label.textContent = item;
        
        const infoIcon = document.createElement('div');
        infoIcon.className = 'info-icon-tooltip';
        infoIcon.title = 'Subject Information';
        infoIcon.innerHTML = '<span class="info-icon"></span>';
        
        content.appendChild(label);
        content.appendChild(infoIcon);
        
        const remove = document.createElement('a');
        remove.href = '#';
        remove.className = 'button-secondary';
        remove.textContent = 'Remove';
        remove.addEventListener('click', e => {
          e.preventDefault();
          removeSubject(childId, item);
          render();
        });
        
        row.appendChild(content);
        row.appendChild(remove);
        list.appendChild(row);
      });
      body.appendChild(list);
    }

    const selectWrap = document.createElement('div');
    selectWrap.className = 'field';
    const label = document.createElement('label');
    label.textContent = 'Choose A Subject';
    label.setAttribute('for', 'subjectSelect');
    const select = document.createElement('select');
    select.id = 'subjectSelect';
    select.innerHTML = `<option value="">Select A Subject</option>` + availableSubjects.map(s => {
      const selected = s === selectedSubject ? ' selected' : '';
      return `<option value="${s}"${selected}>${s}</option>`;
    }).join('');
    selectWrap.appendChild(label);
    selectWrap.appendChild(select);
    body.appendChild(selectWrap);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'button';
    addButton.textContent = 'Add Subject';
    addButton.disabled = !selectedSubject || listSubjectNames(childId).includes(selectedSubject);
    addButton.addEventListener('click', () => {
      if (!selectedSubject) return;
      addSubject(childId, selectedSubject);
      render();
    });
    body.appendChild(addButton);

    const topicWrap = document.createElement('div');
    topicWrap.style.marginTop = 'var(--space-3)';
    if (selectedSubject && topics.length) {
      const heading = document.createElement('p');
      heading.className = 'subtitle';
      heading.textContent = 'Topics And Estimated Weeks';
      topicWrap.appendChild(heading);
      topics.forEach(t => {
        const row = document.createElement('div');
        row.className = 'topic-row';
        const title = document.createElement('div');
        title.textContent = t.mainTopic || t.subject;
        const sub = document.createElement('div');
        sub.className = 'help';
        sub.textContent = t.subtopic || '';
        const week = document.createElement('div');
        week.className = 'help';
        week.textContent = t.estimatedWeek ? `Estimated Week: ${t.estimatedWeek}` : '';
        row.appendChild(title);
        if (sub.textContent) row.appendChild(sub);
        if (week.textContent) row.appendChild(week);
        topicWrap.appendChild(row);
      });
    } else if (selectedSubject) {
      const none = document.createElement('p');
      none.className = 'help';
      none.textContent = 'No Topics Available For This Subject.';
      topicWrap.appendChild(none);
    }
    body.appendChild(topicWrap);

    select.addEventListener('change', async () => {
      selectedSubject = select.value;
      topics = selectedSubject ? await getTopics(year, selectedSubject) : [];
      render();
    });
  };

  const init = async () => {
    body.innerHTML = '<p class="subtitle">Loading Subjects...</p>';
    await loadCurriculum();
    availableSubjects = await getAvailableSubjects(year);
    if (!availableSubjects.length) {
      body.innerHTML = '<p class="subtitle">No Curriculum Subjects Found For This Year.</p>';
      return;
    }
    render();
  };

  init();
  return section;
}
