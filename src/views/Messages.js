import { getActiveUser, ADMIN_USERNAME } from '../usecases/auth.js';
import { sendMessage, getMessages, markReadForUser } from '../usecases/messages.js';

export function Messages(){
  const section = document.createElement('section');
  section.className = 'card';

  const user = getActiveUser();
  if (!user) {
    location.hash = '#/signin';
    return section;
  }

  const render = () => {
    const all = getMessages();
    const thread = all.filter(m => (m.from === user.username && m.to === ADMIN_USERNAME) || (m.to === user.username && m.from === ADMIN_USERNAME));

    section.innerHTML = `
      <h1 class="h1">Messages</h1>
      <p class="subtitle">Send a message to support.</p>

      <div class="message-thread">
        ${thread.length ? '' : '<p class="help">No messages yet.</p>'}
        ${thread.map(m => `
          <div class="message-row ${m.from === user.username ? 'is-sent' : 'is-received'}">
            <div class="message-bubble">
              <div class="message-meta">${m.from === user.username ? 'You' : 'Support'}</div>
              <div>${m.text}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <form class="form" style="margin-top: var(--space-3);">
        <div class="field">
          <label for="msgText">Message</label>
          <textarea id="msgText" name="msgText" rows="3" placeholder="Type your message"></textarea>
        </div>
        <div class="actions-row">
          <button type="submit" class="button">Send</button>
        </div>
      </form>
    `;

    markReadForUser(user.username);

    const form = section.querySelector('form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const text = form.msgText.value;
      if (!text.trim()) return;
      sendMessage(user.username, ADMIN_USERNAME, text);
      form.msgText.value = '';
      render();
    });
  };

  render();
  return section;
}
