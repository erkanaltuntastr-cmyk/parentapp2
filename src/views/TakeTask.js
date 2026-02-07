import { getActiveUser } from '../usecases/auth.js';
import { getAssignmentById, completeAssignment } from '../usecases/assignments.js';

const QUESTIONS = [
  { q: 'What is 7 + 5?', a: '12' },
  { q: 'Which word is a noun? (run / chair / quickly)', a: 'chair' },
  { q: 'What is the capital of England?', a: 'London' }
];

export function TakeTask(){
  const section = document.createElement('section');
  section.className = 'card child-dashboard';

  const user = getActiveUser();
  if (!user || user.role !== 'child') {
    location.hash = '#/signin';
    return section;
  }

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const id = params.get('id');
  const assignment = id ? getAssignmentById(id) : null;
  if (!assignment || assignment.childId !== user.childId) {
    location.hash = '#/child-dashboard';
    return section;
  }

  section.innerHTML = `
    <h1 class="h1">Mission: ${assignment.subject}</h1>
    <p class="subtitle">${assignment.topic}</p>
    <form class="form">
      ${QUESTIONS.map((q, idx) => `
        <div class="field">
          <label for="q${idx}">${q.q}</label>
          <input id="q${idx}" name="q${idx}" type="text" autocomplete="off" />
        </div>
      `).join('')}
      <div class="actions-row">
        <button type="submit" class="button">Submit</button>
        <a class="button-secondary" href="#/child-dashboard">Cancel</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const score = Math.floor(60 + Math.random() * 41);
    completeAssignment(assignment.id, score);
    alert(`Submitted. Score ${score}%`);
    location.hash = '#/child-dashboard';
  });

  return section;
}
