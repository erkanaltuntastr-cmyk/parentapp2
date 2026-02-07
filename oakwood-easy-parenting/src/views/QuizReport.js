import { getActiveUser } from '../usecases/auth.js';
import { getQuizSession, createRetakeSession } from '../usecases/quizzes.js';
import { listHomework, hasPendingHomework } from '../usecases/homework.js';

export function QuizReport(){
  const section = document.createElement('section');
  section.className = 'card quiz-report';

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const id = params.get('id');
  const session = id ? getQuizSession(id) : null;
  if (!session) {
    location.hash = '#/family-hub';
    return section;
  }

  const report = session.report || { strengths: [], growth: [], critical: [] };
  const homeworkItems = listHomework(session.childId, session.subject);
  const pendingHomework = hasPendingHomework(session.childId, session.subject);
  const user = getActiveUser();

  section.innerHTML = `
    <h1 class="h1">Quiz Report</h1>
    <p class="subtitle">${session.subject} \u2022 Score ${session.score || 0}%</p>

    <div class="report-grid">
      <div class="report-card report-strength">
        <h2 class="h2">Strengths</h2>
        ${report.strengths.length ? `<ul>${report.strengths.map(s => `<li>${s}</li>`).join('')}</ul>` : '<p class="help">No strengths recorded.</p>'}
      </div>
      <div class="report-card report-growth">
        <h2 class="h2">Areas for Growth</h2>
        ${report.growth.length ? `<ul>${report.growth.map(s => `<li>${s}</li>`).join('')}</ul>` : '<p class="help">No growth areas recorded.</p>'}
      </div>
      <div class="report-card report-critical">
        <h2 class="h2">Critical Needs</h2>
        ${report.critical.length ? `<ul>${report.critical.map(s => `<li>${s}</li>`).join('')}</ul>` : '<p class="help">No critical needs recorded.</p>'}
      </div>
    </div>

    <div class="homework-panel">
      <h2 class="h2">Homework Generated</h2>
      ${homeworkItems.length ? `
        <div class="homework-list">
          ${homeworkItems.map(item => `
            <div class="homework-item ${item.status === 'completed' ? 'is-complete' : ''}">
              <div class="homework-title">${item.title}</div>
              <div class="help">${item.content}</div>
              <div class="homework-meta">${item.status === 'completed' ? 'Completed' : 'Pending'}</div>
            </div>
          `).join('')}
        </div>
      ` : '<p class="help">No homework items available.</p>'}
      ${pendingHomework ? '<p class="help">Complete homework to unlock a scored re-take.</p>' : ''}
    </div>

    <div class="actions-row" style="margin-top: var(--space-3);">
      <button type="button" class="button" data-role="retake" ${pendingHomework ? 'disabled' : ''}>Re-take Quiz</button>
      <a class="button-secondary" href="${user?.role === 'child' ? '#/child-dashboard' : '#/family-hub'}">Back</a>
    </div>
  `;

  section.querySelector('[data-role="retake"]').addEventListener('click', () => {
    if (pendingHomework) return;
    const next = createRetakeSession(session);
    if (next) {
      location.hash = `#/quiz-session?id=${next.id}`;
    }
  });

  return section;
}
