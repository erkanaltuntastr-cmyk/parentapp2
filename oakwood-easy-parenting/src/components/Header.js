import { getActiveUser, logout } from '../usecases/auth.js';
import { getState } from '../state/appState.js';
import { getUnreadCountForUser } from '../usecases/messages.js';

export function Header(){
  const wrap = document.createElement('div');
  const isChild = user?.role === 'child';
  wrap.className = `global-header${isChild ? ' child-header' : ''}`;

  const user = getActiveUser();
  const parent = getState().parent || null;
  const name = parent?.name
    ? `${parent.name} ${parent.surname || ''}`.trim()
    : (user?.username || 'Parent');
  const initials = name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'P';
  const unread = user && !user.isAdmin && !isChild ? getUnreadCountForUser(user.username) : 0;

  wrap.innerHTML = `
    <div class="header-left">
      <img src="./src/assets/logo.svg" alt="Oakwood logo" class="logo" />
      <span class="brand-line-1">Oakwood</span>
    </div>
    <nav class="header-nav" aria-label="Primary">
      ${isChild
        ? `<a href="#/child-dashboard">My Progress</a>`
        : `<a href="#/messages">Messages${unread ? ` <span class="nav-badge">${unread}</span>` : ''}</a>
           <a href="#/select-child">Children</a>
           <a href="#/settings">Settings</a>`
      }
    </nav>
    <div class="header-right">
      <button class="avatar-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="avatar">${initials}</span>
        <span class="avatar-name">${name}</span>
      </button>
      <div class="header-menu" role="menu" hidden>
        ${isChild
          ? `<a role="menuitem" href="#/child-dashboard">My Progress</a>`
          : `<a role="menuitem" href="#/parent-profile">My Profile</a>
             <a role="menuitem" href="#/settings">Settings</a>`
        }
        <button type="button" role="menuitem" data-role="logout">Logout</button>
      </div>
    </div>
  `;

  const btn = wrap.querySelector('.avatar-btn');
  const menu = wrap.querySelector('.header-menu');
  btn.addEventListener('click', () => {
    const open = !menu.hidden;
    menu.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
  });

  wrap.querySelector('[data-role="logout"]').addEventListener('click', () => {
    logout();
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    location.hash = '#/signin';
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  return wrap;
}
