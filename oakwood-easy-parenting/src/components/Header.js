import { getActiveUser, logout } from '../usecases/auth.js';
import { getState } from '../state/appState.js';
import { getUnreadCountForUser } from '../usecases/messages.js';

export function Header(){
  const wrap = document.createElement('div');
  const user = getActiveUser();
  const isChild = user?.role === 'child';
  const isAdmin = user?.isAdmin;
  const homeHref = isAdmin ? '#/admin'
    : isChild ? '#/child-dashboard'
    : user ? '#/family-hub'
    : '#/welcome';
  wrap.className = `global-header${isChild ? ' child-header' : ''}`;
  const parent = getState().parent || null;
  const name = parent?.name
    ? `${parent.name} ${parent.surname || ''}`.trim()
    : (user?.username || 'Parent');
  const initials = name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'P';
  const unread = user && !user.isAdmin && !isChild ? getUnreadCountForUser(user.username) : 0;

  wrap.innerHTML = `
    <a class="header-left brand-link" href="${homeHref}">
      <img src="./src/assets/logo.svg" alt="Oakwood logo" class="logo" />
      <span class="brand-line-1">Oakwood</span>
    </a>
    <nav class="header-nav" aria-label="Primary">
      ${isChild
        ? `<a href="#/child-dashboard">My Progress</a>`
        : `<a href="#/family-hub">Family Hub</a>
           <a href="#/messages">Messages${unread ? ` <span class="nav-badge">${unread}</span>` : ''}</a>
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
          : `<a role="menuitem" href="#/family-hub">Family Hub</a>
             <a role="menuitem" href="#/parent-profile">My Profile</a>
             <a role="menuitem" href="#/settings">Settings</a>`
        }
        <button type="button" role="menuitem" data-role="logout">Logout</button>
      </div>
    </div>
  `;

  const btn = wrap.querySelector('.avatar-btn');
  const menu = wrap.querySelector('.header-menu');
  const headerRight = wrap.querySelector('.header-right');
  const closeMenu = () => {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };
  btn.addEventListener('click', () => {
    const open = !menu.hidden;
    menu.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
  });
  headerRight.addEventListener('mouseleave', () => {
    closeMenu();
  });
  menu.addEventListener('mouseleave', closeMenu);

  wrap.querySelector('[data-role="logout"]').addEventListener('click', () => {
    logout();
    closeMenu();
    location.hash = '#/signin';
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) {
      closeMenu();
    }
  });

  return wrap;
}
