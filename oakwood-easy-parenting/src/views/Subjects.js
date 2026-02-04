import { getActiveChild } from '../usecases/children.js';
import { listSubjects, addSubject, removeSubject } from '../usecases/subjects.js';

export function Subjects(){
  const section = document.createElement('section');
  section.className = 'card';

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const name = (child.name || '').trim();
  const title = name ? `${name} — subjects` : 'Your child — subjects';

  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    <p class="subtitle">Start by adding the subjects your child studies.</p>
    <div class="subjects-body"></div>
    <div class="actions" style="margin-top: var(--space-4);">
      <a class="button-secondary" href="#/child-overview">Back to overview</a>
      <div style="margin-top: var(--space-1);">
        <a class="button-secondary" href="#/add-child">Add another child</a>
      </div>
    </div>
  `;

  const body = section.querySelector('.subjects-body');
  const childId = child.id;

  const render = () => {
    body.innerHTML = '';
    const subjects = listSubjects(childId);

    if (!subjects.length) {
      const empty = document.createElement('p');
      empty.className = 'subtitle';
      empty.textContent = 'No subjects yet.';
      body.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'subject-list';
      subjects.forEach(item => {
        const row = document.createElement('div');
        row.className = 'subject-row';
        const label = document.createElement('span');
        label.textContent = item;
        const remove = document.createElement('a');
        remove.href = '#';
        remove.className = 'button-secondary';
        remove.textContent = 'Remove';
        remove.addEventListener('click', e => {
          e.preventDefault();
          removeSubject(childId, item);
          render();
        });
        row.appendChild(label);
        row.appendChild(remove);
        list.appendChild(row);
      });
      body.appendChild(list);
    }

    const addWrap = document.createElement('div');
    addWrap.className = 'add-subject';
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'button';
    addButton.textContent = 'Add a subject';
    addWrap.appendChild(addButton);
    body.appendChild(addWrap);

    addButton.addEventListener('click', () => {
      addWrap.innerHTML = '';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'e.g., Mathematics';
      input.className = 'subject-input';
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'button';
      add.textContent = 'Add';
      const cancel = document.createElement('a');
      cancel.href = '#';
      cancel.className = 'button-secondary';
      cancel.textContent = 'Cancel';
      cancel.addEventListener('click', e => {
        e.preventDefault();
        render();
      });
      add.addEventListener('click', () => {
        addSubject(childId, input.value);
        render();
      });
      addWrap.appendChild(input);
      addWrap.appendChild(add);
      addWrap.appendChild(cancel);
      input.focus();
    });
  };

  render();
  return section;
}
