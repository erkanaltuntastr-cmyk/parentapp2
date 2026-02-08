import { getState } from '../state/appState.js';
import { getActiveUser, ADMIN_USERNAME } from '../usecases/auth.js';
import { sendMessage, getMessages } from '../usecases/messages.js';

function toProperCase(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isEmail(value){
  return String(value || '').includes('@');
}

export function AdminPanel(){
  const section = document.createElement('section');
  section.className = 'card admin-panel';

  const user = getActiveUser();
  if (!user || !user.isAdmin) {
    location.hash = '#/signin';
    return section;
  }

  let tab = 'users';

  const renderUsers = () => {
    const state = getState();
    const children = state.children || [];
    const users = state.users || [];
    const rows = users.map(u => {
      const name = u.profile?.name ? `${u.profile.name} ${u.profile.surname || ''}`.trim() : u.username;
      const email = isEmail(u.username) ? u.username : '-';
      const count = children.filter(c => c.userId === u.id).length || 0;
      return `
        <div class="admin-row">
          <div class="admin-cell">
            <div class="admin-name">${name}</div>
            <div class="help">${email}</div>
          </div>
          <div class="admin-cell">Students: ${count}</div>
          <div class="admin-cell">
            <button class="button-secondary" data-view="${u.id}">View Profile</button>
          </div>
        </div>
      `;
    }).join('');
    return `
      <h2 class="h2">Users</h2>
      <div class="admin-list">
        ${rows || '<p class="help">No Registered Users.</p>'}
      </div>
    `;
  };

  const renderMessages = () => {
    const state = getState();
    const users = state.users || [];
    const messages = getMessages();
    const list = messages.map(m => `
      <div class="admin-row">
        <div class="admin-cell">
          <div class="admin-name">${m.from} → ${m.to}</div>
          <div class="help">${new Date(m.at).toLocaleString('en-GB')}</div>
        </div>
        <div class="admin-cell">${m.text}</div>
      </div>
    `).join('');

    return `
      <h2 class="h2">Messages</h2>
      <div class="admin-list">
        ${list || '<p class="help">No Messages.</p>'}
      </div>
      <form class="form" style="margin-top: var(--space-3);">
        <div class="field">
          <label for="msgTo">Reply To</label>
          <input id="msgTo" name="msgTo" type="text" list="userList" placeholder="Username" required />
          <datalist id="userList">
            ${users.map(u => `<option value="${u.username}"></option>`).join('')}
          </datalist>
        </div>
        <div class="field">
          <label for="msgText">Message</label>
          <textarea id="msgText" name="msgText" rows="3" required></textarea>
        </div>
        <div class="actions-row">
          <button type="submit" class="button">Send Reply</button>
        </div>
      </form>
    `;
  };

  const render = () => {
    section.innerHTML = `
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <button type="button" class="button-secondary ${tab === 'users' ? 'is-selected' : ''}" data-tab="users">Users</button>
          <button type="button" class="button-secondary ${tab === 'messages' ? 'is-selected' : ''}" data-tab="messages">Messages</button>
          <button type="button" class="button-secondary ${tab === 'logs' ? 'is-selected' : ''}" data-tab="logs">Logs</button>
        </aside>
        <div class="admin-content">
          ${tab === 'users' ? renderUsers() : ''}
          ${tab === 'messages' ? renderMessages() : ''}
          ${tab === 'logs' ? '<h2 class="h2">Logs</h2><p class="help">System logs are not enabled in local-first mode.</p>' : ''}
        </div>
      </div>
    `;

    section.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        tab = btn.getAttribute('data-tab');
        render();
      });
    });

    section.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-view');
        const u = getState().users.find(x => x.id === id);
        if (!u) return;
        const name = u.profile?.name ? `${u.profile.name} ${u.profile.surname || ''}`.trim() : u.username;
        alert(`Profile: ${name}`);
      });
    });

    const form = section.querySelector('form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const to = form.msgTo.value.trim();
        const text = form.msgText.value.trim();
        if (!to || !text) return;
        sendMessage(ADMIN_USERNAME, to, text);
        form.msgText.value = '';
        render();
      });
    }
  };

  render();
  return section;
}
