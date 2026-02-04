import { getActiveChild } from '../usecases/children.js';
import { listSubjects } from '../usecases/subjects.js';
import { getTrafficLight, getNeedsFocus, calculateTrend } from '../usecases/analytics.js';

export function ChildOverview(){
  const section = document.createElement('section');
  section.className = 'card';

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const name = (child.name || '').trim();
  const year = Number(child.year || 0);
  const school = (child.school || '').trim();

  const title = name ? `${name} — overview` : 'Your child — overview';
  let meta = '';
  if (Number.isFinite(year) && year > 0) {
    meta = `Year ${year}`;
  }
  if (school) {
    meta = meta ? `${meta} • ${school}` : school;
  }

  section.innerHTML = `
    <h1 class="h1">${title}</h1>
    ${meta ? `<p class="subtitle">${meta}</p>` : ''}
    <div class="overview-body"></div>
    <div class="actions" style="margin-top: var(--space-4);">
      <a class="button" href="#/subjects">View subjects</a>
      <div style="margin-top: var(--space-2);">
        <a class="button-secondary" href="#/add-child">Add another child</a>
      </div>
      <div style="margin-top: var(--space-1);">
        <a class="button-secondary" href="#/welcome">Back to welcome</a>
      </div>
    </div>
  `;

  const body = section.querySelector('.overview-body');
  const subjects = listSubjects(child.id);
  const assessments = child.assessments || {};

  const summaries = subjects.map(subject => {
    const scores = Array.isArray(assessments[subject]) ? assessments[subject] : [];
    const latest = scores.length ? scores[scores.length - 1] : null;
    return {
      name: subject,
      latest,
      traffic: getTrafficLight(latest),
      trend: calculateTrend(scores)
    };
  });

  const needsFocus = getNeedsFocus(summaries);

  const needs = document.createElement('div');
  needs.className = 'needs-focus';
  const needsTitle = document.createElement('p');
  needsTitle.className = 'subtitle';
  needsTitle.textContent = 'Needs Focus';
  needs.appendChild(needsTitle);
  if (needsFocus.length) {
    const list = document.createElement('div');
    list.className = 'needs-list';
    needsFocus.forEach(name => {
      const item = document.createElement('div');
      item.className = 'needs-item';
      const dot = document.createElement('span');
      dot.className = 'traffic traffic-red';
      const label = document.createElement('span');
      label.textContent = name;
      item.appendChild(dot);
      item.appendChild(label);
      list.appendChild(item);
    });
    needs.appendChild(list);
  } else {
    const none = document.createElement('p');
    none.className = 'help';
    none.textContent = 'No subjects need focus yet.';
    needs.appendChild(none);
  }
  body.appendChild(needs);

  const cards = document.createElement('div');
  cards.className = 'subject-cards';
  if (!summaries.length) {
    const empty = document.createElement('p');
    empty.className = 'subtitle';
    empty.textContent = 'No subjects yet.';
    cards.appendChild(empty);
  } else {
    summaries.forEach(s => {
      const row = document.createElement('div');
      row.className = 'subject-card';
      const head = document.createElement('div');
      head.className = 'subject-head';
      const nameEl = document.createElement('span');
      nameEl.textContent = s.name;
      const traffic = document.createElement('span');
      traffic.className = `traffic ${s.traffic ? `traffic-${s.traffic}` : 'traffic-none'}`;
      head.appendChild(nameEl);
      head.appendChild(traffic);
      row.appendChild(head);

      const meta = document.createElement('div');
      meta.className = 'help';
      if (s.latest === null || s.latest === undefined) {
        meta.textContent = 'No assessment yet.';
      } else {
        const trendLabel = s.trend === 'improving' ? 'Improving'
          : s.trend === 'declining' ? 'Declining'
          : 'Stable';
        meta.textContent = `Latest score: ${s.latest} · Trend: ${trendLabel}`;
      }
      row.appendChild(meta);
      cards.appendChild(row);
    });
  }
  body.appendChild(cards);

  return section;
}
