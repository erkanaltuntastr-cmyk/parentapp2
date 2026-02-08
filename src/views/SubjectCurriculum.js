import { getActiveChild, getCurriculumSelection, setCurriculumSelection } from '../usecases/children.js';
import { addSubject, listSubjectNames } from '../usecases/subjects.js';
import { getAvailableSubjects, getTopics, loadCurriculum } from '../usecases/curriculum.js';
import { getState } from '../state/appState.js';
import { getCurrentSchoolWeek, parseEstimatedWeek } from '../utils/schoolWeek.js';

const SAMPLE_SUBJECTS = [
  'English',
  'Mathematics',
  'Science',
  'History',
  'Geography',
  'Art and Design',
  'Physical Education'
];

function normaliseSelection(raw){
  return {
    main: raw?.main ? { ...raw.main } : {},
    sub: raw?.sub ? { ...raw.sub } : {}
  };
}

function unique(list){
  return Array.from(new Set(list.filter(Boolean)));
}

export function SubjectCurriculum(){
  const section = document.createElement('section');
  section.className = 'card';

  let child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  section.innerHTML = `
    <h1 class="h1"></h1>
    <p class="subtitle">Select a subject to view topics for the current school week.</p>
    <div class="curriculum-body"></div>
    <div class="actions" style="margin-top: var(--space-4);">
      <a class="button-secondary" href="#/child-overview">Back to overview</a>
      <div style="margin-top: var(--space-1);">
        <a class="button-secondary" href="#/select-child">Family Tree</a>
      </div>
    </div>
  `;

  const body = section.querySelector('.curriculum-body');
  const titleEl = section.querySelector('.h1');
  const setTitle = current => {
    const name = (current?.name || '').trim();
    titleEl.textContent = name ? `${name} - curriculum` : 'Your student - curriculum';
  };
  setTitle(child);

  let year = child.year;
  let available = [];
  let selected = '';
  let topics = [];
  let isSample = false;
  const expanded = new Set();

  const render = () => {
    body.innerHTML = '';
    const currentWeek = getCurrentSchoolWeek();

    const weekBar = document.createElement('div');
    weekBar.className = 'week-banner';
    weekBar.innerHTML = `
      <div class="help">Current school week</div>
      <div class="week-number">Week ${currentWeek}</div>
    `;
    body.appendChild(weekBar);

    const boxWrap = document.createElement('div');
    boxWrap.className = 'subject-boxes';
    available.forEach(sub => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `subject-box${sub === selected ? ' is-selected' : ''}`;
      btn.textContent = sub;
      btn.addEventListener('click', async () => {
        selected = sub;
        topics = await getTopics(year, sub);
        render();
      });
      boxWrap.appendChild(btn);
    });
    body.appendChild(boxWrap);

    if (isSample) {
      const banner = document.createElement('div');
      banner.className = 'empty-state';
      banner.innerHTML = `
        <p class="subtitle">Curriculum for this year is coming soon.</p>
        <a class="button-secondary" href="#/messages">Contact Support</a>
      `;
      body.appendChild(banner);
    }

    if (!selected) return;

    const added = listSubjectNames(child.id);
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'button';
    addBtn.textContent = added.includes(selected) ? 'Subject Added' : 'Add Subject';
    addBtn.disabled = added.includes(selected);
    addBtn.addEventListener('click', () => {
      addSubject(child.id, selected);
      render();
    });
    body.appendChild(addBtn);

    const detailHead = document.createElement('div');
    detailHead.className = 'subject-detail-head';
    detailHead.innerHTML = `
      <h2 class="h2">${selected}</h2>
      <button type="button" class="button-secondary" data-role="select-all">Select Topics for Exam</button>
    `;
    body.appendChild(detailHead);

    const selection = normaliseSelection(getCurriculumSelection(child.id, selected));
    const groups = {};
    topics.forEach(t => {
      const main = (t.mainTopic || t.subject || '').trim();
      if (!main) return;
      const sub = (t.subtopic || '').trim();
      if (!groups[main]) groups[main] = [];
      groups[main].push({ sub, estimatedWeek: t.estimatedWeek || '' });
    });

    const list = document.createElement('div');
    list.className = 'curriculum-list';

    const updateSelection = next => {
      setCurriculumSelection(child.id, selected, next);
    };

    Object.entries(groups).forEach(([main, entries]) => {
      const subtopics = unique(entries.map(e => e.sub || 'General'));
      const weekMap = {};
      entries.forEach(entry => {
        const label = entry.sub || 'General';
        if (!weekMap[label]) weekMap[label] = entry.estimatedWeek || '';
      });
      const mainWeek = entries.map(e => parseEstimatedWeek(e.estimatedWeek)).filter(Boolean);
      const mainWeekLabel = mainWeek.length ? `Expected Week: ${Math.min(...mainWeek)}` : '';
      const mainSelected = subtopics.length
        ? subtopics.every(s => selection.sub?.[main]?.[s])
        : Boolean(selection.main?.[main]);

      const row = document.createElement('div');
      row.className = 'topic-main';
      row.innerHTML = `
        <div class="topic-main-row">
          <label class="check">
            <input type="checkbox" ${mainSelected ? 'checked' : ''} />
            <span>${main}</span>
          </label>
          <button type="button" class="expand-btn" aria-label="Toggle subtopics">+</button>
        </div>
        ${mainWeekLabel ? `<div class="help expected-week">${mainWeekLabel}</div>` : ''}
      `;

      const mainCheck = row.querySelector('input[type="checkbox"]');
      mainCheck.addEventListener('change', e => {
        const checked = e.target.checked;
        const next = normaliseSelection(selection);
        next.main[main] = checked;
        next.sub[main] = {};
        subtopics.forEach(s => { next.sub[main][s] = checked; });
        updateSelection(next);
        render();
      });

      const subList = document.createElement('div');
      subList.className = `subtopic-list${expanded.has(main) ? ' is-open' : ''}`;
      subtopics.forEach(sub => {
        const checked = Boolean(selection.sub?.[main]?.[sub]);
        const rawWeek = weekMap[sub] || '';
        const parsedWeek = parseEstimatedWeek(rawWeek);
        const weekLabel = rawWeek ? `Expected Week: ${rawWeek}` : '';
        let weekClass = '';
        if (parsedWeek) {
          if (parsedWeek < currentWeek) weekClass = ' is-complete';
          if (parsedWeek > currentWeek) weekClass = ' is-future';
        }
        const subRow = document.createElement('label');
        subRow.className = `subtopic-item${weekClass}`;
        subRow.innerHTML = `
          <input type="checkbox" ${checked ? 'checked' : ''} />
          <span>${sub}</span>
          ${weekLabel ? `<span class="subtopic-week">${weekLabel}</span>` : ''}
        `;
        subRow.querySelector('input').addEventListener('change', e => {
          const next = normaliseSelection(selection);
          if (!next.sub[main]) next.sub[main] = {};
          next.sub[main][sub] = e.target.checked;
          const all = subtopics.every(s => next.sub[main][s]);
          next.main[main] = all;
          updateSelection(next);
        });
        subList.appendChild(subRow);
      });
      row.appendChild(subList);

      row.querySelector('.expand-btn').addEventListener('click', () => {
        if (expanded.has(main)) expanded.delete(main);
        else expanded.add(main);
        render();
      });

      list.appendChild(row);
    });

    body.appendChild(list);

    detailHead.querySelector('[data-role="select-all"]').addEventListener('click', () => {
      const next = { main: {}, sub: {} };
      Object.keys(groups).forEach(main => {
        next.main[main] = true;
        next.sub[main] = {};
        const subtopics = unique(groups[main].map(e => e.sub || 'General'));
        subtopics.forEach(s => { next.sub[main][s] = true; });
      });
      updateSelection(next);
      render();
    });
  };

  const init = async () => {
    body.innerHTML = '<p class="subtitle">Loading curriculum...</p>';
    await loadCurriculum();
    available = await getAvailableSubjects(year);
    isSample = false;
    if (!available.length) {
      available = [...SAMPLE_SUBJECTS];
      isSample = true;
    }
    render();
  };

  init();

  let activeId = getState().activeChildId;
  const onHash = () => {
    if (location.hash !== '#/subjects') {
      clearInterval(watchId);
      window.removeEventListener('hashchange', onHash);
    }
  };
  window.addEventListener('hashchange', onHash);
  const watchId = setInterval(async () => {
    const nextId = getState().activeChildId;
    if (nextId !== activeId) {
      activeId = nextId;
      child = getActiveChild();
      if (!child) {
        location.hash = '#/add-child';
        return;
      }
      setTitle(child);
      year = child.year;
      selected = '';
      topics = [];
      expanded.clear();
      await init();
    }
  }, 300);

  return section;
}
