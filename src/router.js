import { Welcome } from './views/Welcome.js';
import { AddChild } from './views/AddChild.js';
import { ChildOverview } from './views/ChildOverview.js';
import { SignIn } from './views/SignIn.js';
import { Register } from './views/Register.js';
import { Settings } from './views/Settings.js';
import { SelectChild } from './views/SelectChild.js';
import { ParentProfile } from './views/ParentProfile.js';
import { ForgotPassword } from './views/ForgotPassword.js';
import { Messages } from './views/Messages.js';
import { AdminPanel } from './views/AdminPanel.js';
import { FamilyHub } from './views/FamilyHub.js';
import { QuizWizard } from './views/QuizWizard.js';
import { QuizSession } from './views/QuizSession.js';
import { QuizReport } from './views/QuizReport.js';
import { ManualQuiz } from './views/ManualQuiz.js';
import { SubjectCurriculum } from './views/SubjectCurriculum.js';
import { Header } from './components/Header.js';
import { getActiveChild } from './usecases/children.js';
import { getState } from './state/appState.js';
import { getActiveUser } from './usecases/auth.js';
import { startInactivity, stopInactivity } from './usecases/inactivity.js';
import { isPinRequired } from './usecases/pin.js';
import { PinEntry } from './views/PinEntry.js';
import { PinSetup } from './views/PinSetup.js';
import { ChildDashboard } from './views/ChildDashboard.js';
import { TakeTask } from './views/TakeTask.js';

// ROUTES
const routes = {
  '': Welcome,
  '#/': Welcome,
  '#/welcome': Welcome,
  '#/add-child': AddChild,
  '#/child-overview': ChildOverview,
  '#/select-child': SelectChild,
  '#/signin': SignIn,
  '#/register': Register,
  '#/forgot-password': ForgotPassword,
  '#/parent-profile': ParentProfile,
  '#/settings': Settings,
  '#/family-hub': FamilyHub,
  '#/admin': AdminPanel,
  '#/child-dashboard': ChildDashboard,
  '#/take-task': TakeTask,
  '#/quiz-wizard': QuizWizard,
  '#/quiz-generator': QuizWizard,
  '#/quiz-session': QuizSession,
  '#/quiz-report': QuizReport,
  '#/manual-quiz': ManualQuiz,
  '#/subject': SubjectCurriculum,
  '#/subjects': SubjectCurriculum,
  '#/pin-entry': PinEntry,
  '#/pin-setup': PinSetup,
  '#/export': () => placeholder('Export'),
  '#/reset': () => placeholder('Reset'),
  '#/messages': Messages,
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
// Order: Auth -> Child selection -> PIN -> Inactivity (5m)
// Filled later per route; they currently pass-through by design.
async function guardAuth(route){
  const allow = ['#/signin', '#/register', '#/forgot-password'];
  if (allow.includes(route)) return null;
  const state = getState();
  if (!state.activeUserId) {
    stopInactivity();
    return { redirect: '#/signin' };
  }
  const user = getActiveUser();
  if (user?.isAdmin) {
    if (route !== '#/admin') return { redirect: '#/admin' };
    return null;
  }
  if (user?.role === 'child') {
    const childAllowed = ['#/child-dashboard', '#/take-task', '#/quiz-session', '#/quiz-report'];
    if (!childAllowed.includes(route)) {
      return { redirect: '#/child-dashboard' };
    }
    return null;
  }
  startInactivity();
  return null;
}
async function guardChildSelected(route){
  const state = getState();
  const children = state.children || [];
  const activeValid = state.activeChildId && children.some(c => c.id === state.activeChildId);
  const needsChild = ['#/child-overview', '#/quiz-wizard', '#/manual-quiz', '#/subject', '#/subjects'];
  const target = children.length ? '#/family-hub' : '#/add-child';
  if (route === '#/welcome' && !activeValid) {
    return { redirect: target };
  }
  if (needsChild.includes(route) && !activeValid) {
    return { redirect: target };
  }
  return null;
}
async function guardPin(route){
  const sensitive = ['#/settings', '#/export', '#/reset'];
  if (!sensitive.includes(route)) return null;
  if (!isPinRequired()) return null;
  if (window.__oakwoodPinVerified) return null;
  window.__oakwoodPinRedirect = route;
  return { redirect: '#/pin-entry' };
}
async function guardInactivity(_route){ return null; }

const guardChain = [guardAuth, guardChildSelected, guardPin, guardInactivity];

let brandMarkup = null;
function renderHeader(route){
  const header = document.querySelector('.site-header');
  if (!header) return;
  if (!brandMarkup) brandMarkup = header.innerHTML;
  const hideFor = ['#/signin', '#/register'];
  if (hideFor.includes(route)) {
    header.innerHTML = brandMarkup;
    return;
  }
  header.innerHTML = '';
  header.appendChild(Header());
}

// ROUTER
export async function router(){
  const app = document.getElementById('app');
  if(!app) return;

  // Choose route
  const key = location.hash || '#/welcome';
  const route = key.split('?')[0];
  renderHeader(route);

  // Run guards
  for (const guard of guardChain) {
    const outcome = await guard(route);
    if (outcome && outcome.redirect) {
      location.hash = outcome.redirect;
      return;
    }
  }

  // Render
  app.innerHTML = '';
  const View = routes[route] || Welcome;
  const node = View();
  app.appendChild(node);
  app.focus(); // A11y: move focus to main content
}
