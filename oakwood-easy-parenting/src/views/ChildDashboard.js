import { getActiveUser, ADMIN_USERNAME } from '../usecases/auth.js';
import { listAssignments } from '../usecases/assignments.js';
import { listSubjects } from '../usecases/subjects.js';
import { getState } from '../state/appState.js';
import { setActiveChild } from '../usecases/children.js';
import { getTeachersForChild } from '../usecases/teachers.js';
import { sendMessage, getMessages } from '../usecases/messages.js';

function scoreToStatus(score){
  if (score === null || score === undefined) return 'none';
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'orange';
}

export function ChildDashboard(){
  const section = document.createElement('section');
  section.className = 'card child-dashboard';

  const user = getActiveUser();
  if (!user || user.role !== 'child') {
    location.hash = '#/signin';
    return section;
  }

  if (user.childId) {
    setActiveChild(user.childId);
  }

  const pending = listAssignments(user.childId, 'pending');
  const completed = listAssignments(user.childId, 'completed');
  const subjects = listSubjects(user.childId);
  const child = (getState().children || []).find(c => c.id === user.childId);
  const teachers = user.childId ? getTeachersForChild(user.childId) : [];
  const parentUser = child?.userId ? getState().users.find(u => u.id === child.userId) : null;
  const recipients = [
    { label: 'Parents', value: parentUser?.username || '' },
    { label: 'Admin', value: ADMIN_USERNAME },
    ...teachers.map(t => ({ label: t.name || 'Teacher', value: t.email || t.name || 'Teacher' }))
  ].filter(r => r.value);

  const latestScores = {};
  completed.forEach(a => {
    if (!a.subject) return;
    if (!latestScores[a.subject] || (a.completedAt || '') > (latestScores[a.subject].completedAt || '')) {
      latestScores[a.subject] = a;
    }
  });

  section.innerHTML = `
    <h1 class="h1">Learning Mode</h1>
    <p class="subtitle">Focus on your missions and celebrate progress.</p>

    <div class="child-section">
      <h2 class="h2">Subject Grid</h2>
      <div class="subject-grid">
        ${subjects.length ? subjects.map(s => {
          const score = latestScores[s]?.score;
          const status = scoreToStatus(score);
          const label = status === 'green' ? 'High'
            : status === 'yellow' ? 'Working towards'
            : status === 'orange' ? 'Support needed'
            : 'No data';
          return `
            <div class="subject-tile ${status}">
              <div class="subject-name">${s}</div>
              <div class="subject-status">${label}</div>
            </div>
          `;
        }).join('') : '<p class="help">No subjects assigned yet.</p>'}
      </div>
    </div>

    <div class="child-section" style="margin-top: var(--space-4);">
      <h2 class="h2">My Missions</h2>
      <div class="mission-list">
        ${pending.length ? '' : '<p class="help">No missions yet.</p>'}
        ${pending.map(a => `
          <div class="mission-card">
            <div>
              <div class="mission-title">${a.subject} - ${a.topic}</div>
              <div class="help">${a.type === 'exam' ? 'Exam' : 'Homework'} - Due ${a.deadline || 'No deadline'}</div>
            </div>
            <a class="button" href="#/take-task?id=${a.id}">Start</a>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="child-section" style="margin-top: var(--space-4);">
      <h2 class="h2">Achievement Gallery</h2>
      <div class="mission-list">
        ${completed.length ? '' : '<p class="help">No achievements yet.</p>'}
        ${completed.map(a => `
          <div class="mission-card completed">
            <div>
              <div class="mission-title">${a.subject} - ${a.topic}</div>
              <div class="help">Score ${a.score || 0}% - Completed</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="child-section" style="margin-top: var(--space-4);">
      <h2 class="h2">My Tools</h2>
      <div class="tool-grid">
        <div class="tool-card">
          <h3 class="h3">Notes</h3>
          <textarea rows="4" placeholder="Write a quick note..."></textarea>
        </div>
        <div class="tool-card">
          <h3 class="h3">To-Do List</h3>
          <div class="todo-list">
            <div class="todo-input">
              <input type="text" placeholder="Add a task" />
              <button type="button" class="button-secondary" data-role="add-todo">Add</button>
            </div>
            <div class="todo-items"></div>
          </div>
        </div>
        <div class="tool-card">
          <h3 class="h3">Organizer</h3>
          <p class="help">Planner is coming soon.</p>
        </div>
      </div>
    </div>

    <div class="child-section" style="margin-top: var(--space-4);">
      <h2 class="h2">Messages</h2>
      <div class="message-thread">
        ${renderMessages(user.username)}
      </div>
      ${recipients.length ? `
        <form class="form" data-role="child-chat" style="margin-top: var(--space-3);">
          <div class="field">
            <label for="childRecipient">Send To</label>
            <select id="childRecipient" name="childRecipient">
              ${recipients.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="childMessage">Message</label>
            <textarea id="childMessage" name="childMessage" rows="3" placeholder="Type your message"></textarea>
          </div>
          <div class="actions-row">
            <button type="submit" class="button">Send</button>
          </div>
        </form>
      ` : '<p class="help">Messaging is available once a parent or teacher is linked.</p>'}
    </div>
  `;

  const todoItems = section.querySelector('.todo-items');
  const todoInput = section.querySelector('.todo-input input');
  section.querySelector('[data-role="add-todo"]').addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (!text) return;
    const row = document.createElement('label');
    row.className = 'todo-item';
    row.innerHTML = `<input type="checkbox" /> <span>${text}</span>`;
    todoItems.appendChild(row);
    todoInput.value = '';
  });

  const chatForm = section.querySelector('[data-role="child-chat"]');
  if (chatForm) {
    chatForm.addEventListener('submit', e => {
      e.preventDefault();
      const to = chatForm.childRecipient.value;
      const text = chatForm.childMessage.value.trim();
      if (!to || !text) return;
      sendMessage(user.username, to, text);
      chatForm.childMessage.value = '';
      const thread = section.querySelector('.message-thread');
      thread.innerHTML = renderMessages(user.username);
    });
  }

  return section;
}

function renderMessages(username){
  const all = getMessages();
  const thread = all.filter(m => m.from === username || m.to === username);
  if (!thread.length) return '<p class="help">No messages yet.</p>';
  return thread.map(m => `
    <div class="message-row ${m.from === username ? 'is-sent' : 'is-received'}">
      <div class="message-bubble">
        <div class="message-meta">${m.from === username ? 'You' : m.from}</div>
        <div>${m.text}</div>
      </div>
    </div>
  `).join('');
}
