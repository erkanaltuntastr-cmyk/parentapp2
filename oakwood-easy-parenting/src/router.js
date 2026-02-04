import { Welcome } from './views/Welcome.js';
import { AddChild } from './views/AddChild.js';
import { ChildOverview } from './views/ChildOverview.js';
import { Subjects } from './views/Subjects.js';
import { getActiveChild } from './usecases/children.js';
import { SignIn } from './views/SignIn.js';

// ROUTES
const routes = {
  '': Welcome,
  '#/': Welcome,
  '#/welcome': Welcome,
  '#/add-child': AddChild,
  '#/child-overview': ChildOverview,
  '#/subjects': Subjects,
  '#/signin': SignIn,
  '#/privacy': () => placeholder('Privacy Policy (placeholder)'),
  '#/terms': () => placeholder('Terms of Service (placeholder)'),
  '#/cookies': () => placeholder('Cookie Settings (placeholder)')
};

// PLACEHOLDER VIEW
function placeholder(title){
  const el = document.createElement('section');
  el.className = 'card';
  el.innerHTML = `<h1 class="h1">${title}</h1><p class="subtitle">This screen is a placeholder. Navigation works; content will be implemented in the next steps.</p>`;
  return el;
}

// GUARD PIPELINE (stubs)
// Order: Auth → Child selection → PIN → Inactivity (5m)
// Filled later per route; they currently pass-through by design.
async function guardAuth(_route){ return null; }
async function guardChildSelected(route){
  const needsChild = ['#/child-overview', '#/subjects'];
  if (needsChild.includes(route) && !getActiveChild()) {
    return { redirect: '#/add-child' };
  }
  return null;
}
async function guardPin(_route){ return null; }
async function guardInactivity(_route){ return null; }

const guardChain = [guardAuth, guardChildSelected, guardPin, guardInactivity];

// ROUTER
export async function router(){
  const app = document.getElementById('app');
  if(!app) return;

  // Choose route
  const key = location.hash || '#/welcome';

  // Run guards
  for (const guard of guardChain) {
    const outcome = await guard(key);
    if (outcome && outcome.redirect) {
      location.hash = outcome.redirect;
      return;
    }
  }

  // Render
  app.innerHTML = '';
  const View = routes[key] || Welcome;
  const node = View();
  app.appendChild(node);
  app.focus(); // A11y: move focus to main content
}
