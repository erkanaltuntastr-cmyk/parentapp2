import { getActiveChild, getCurriculumSelection, setCurriculumSelection } from '../usecases/children.js';
import { getAvailableSubjects, getTopics, loadCurriculum } from '../usecases/curriculum.js';
import { getState } from '../state/appState.js';
import { parseEstimatedWeek, getCurrentSchoolWeek } from '../utils/schoolWeek.js';

function toProperCase(str) {
  if (!str) return '';
  return String(str)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function toSentenceCase(str) {
  if (!str) return '';
  const s = String(str).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normaliseSelection(raw){
  return {
    main: raw?.main ? { ...raw.main } : {},
    sub: raw?.sub ? Object.fromEntries(Object.entries(raw.sub).map(([k, v]) => [k, { ...v }])) : {}
  };
}

function hasSelection(selection){
  if (!selection) return false;
  const hasMain = Object.values(selection.main || {}).some(Boolean);
  const hasSub = Object.values(selection.sub || {}).some(map => Object.values(map || {}).some(Boolean));
  return hasMain || hasSub;
}

function unique(list){
  return Array.from(new Set(list.filter(Boolean)));
}

function buildGroups(rows){
  const groups = {};
  rows.forEach(row => {
    const main = (row.mainTopic || row.subject || 'General').trim();
    if (!main) return;
    const sub = (row.subtopic || 'General').trim();
    if (!groups[main]) groups[main] = [];
    groups[main].push({
      sub,
      estimatedWeek: row.estimatedWeek || '',
      difficulty: row.difficulty || ''
    });
  });
  return groups;
}

function buildAutoSelection(groups, currentWeek){
  const next = { main: {}, sub: {} };
  Object.entries(groups).forEach(([main, entries]) => {
    entries.forEach(entry => {
      const sub = entry.sub || 'General';
      const week = parseEstimatedWeek(entry.estimatedWeek);
      if (week && week <= currentWeek) {
        if (!next.sub[main]) next.sub[main] = {};
        next.sub[main][sub] = true;
      }
    });
  });
  Object.entries(groups).forEach(([main, entries]) => {
    const subs = unique(entries.map(e => e.sub || 'General'));
    if (!subs.length) return;
    const allSelected = subs.every(s => next.sub?.[main]?.[s]);
    next.main[main] = allSelected;
  });
  return next;
}

function syncMainSelection(selection, groups){
  const next = normaliseSelection(selection);
  Object.entries(groups).forEach(([main, entries]) => {
    const subs = unique(entries.map(e => e.sub || 'General'));
    if (!subs.length) return;
    const allSelected = subs.every(s => next.sub?.[main]?.[s]);
    next.main[main] = allSelected;
  });
  return next;
}

export function SubjectCurriculum(){
  const section = document.createElement('section');
  section.className = 'card';
  const clockIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const subjectParam = params.get('subject') || params.get('name') || '';
  let subject = subjectParam || '';
  const year = child.year;
  const state = getState();
  const totalWeeks = Number.isFinite(state.expectedTeachingWeeks) ? state.expectedTeachingWeeks : 36;
  const currentWeek = getCurrentSchoolWeek();
  const termStart = new Date(state.currentSchoolTermStartDate);
  const termStartFuture = !Number.isNaN(termStart.getTime()) && termStart.getTime() > Date.now();

  section.innerHTML = `
    <h1 class="h1"></h1>
    <p class="subtitle"></p>
    <div class="curriculum-body"></div>
    <div class="actions-row" style="margin-top: var(--space-4);">
      <a class="button" href="#/quiz-wizard?subject=${encodeURIComponent(subject || '')}">Quiz Generator</a>
      <a class="button-secondary" href="#/child-overview">Back to Student Overview</a>
    </div>
  `;

  const titleEl = section.querySelector('.h1');
  const subtitleEl = section.querySelector('.subtitle');
  const body = section.querySelector('.curriculum-body');
  const weekBanner = `
    <div class="week-banner">
      <div>
        <div class="help">School Week</div>
        <div class="help">Approximate – excludes holidays.</div>
        ${termStartFuture ? '<div class="week-warning">Term start date future – check settings</div>' : ''}
      </div>
      <div class="week-number">Week ${currentWeek} / ${totalWeeks}</div>
    </div>
  `;

  const renderSubjectPicker = async () => {
    body.innerHTML = '<p class="subtitle">Loading subjects...</p>';
    await loadCurriculum();
    const subjects = await getAvailableSubjects(year);
    if (!subjects.length) {
      body.innerHTML = '<p class="help">No subjects found for this year.</p>';
      return;
    }
    body.innerHTML = `
      ${weekBanner}
      <div class="subject-boxes"></div>
    `;
    const wrap = body.querySelector('.subject-boxes');
    wrap.innerHTML = subjects
      .sort((a, b) => a.localeCompare(b))
      .map(name => `<button type="button" class="subject-box" data-subject="${name}">${toProperCase(name)}</button>`)
      .join('');
    wrap.querySelectorAll('[data-subject]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.getAttribute('data-subject');
        if (!next) return;
        location.hash = `#/subject?subject=${encodeURIComponent(next)}`;
      });
    });
  };

  const renderSubjectPage = async () => {
    body.innerHTML = '<p class="subtitle">Loading curriculum...</p>';

    await loadCurriculum();
    const rows = await getTopics(year, subject);
    if (!rows.length) {
      body.innerHTML = '<p class="help">No topics found for this subject and year.</p>';
      return;
    }

    const groups = buildGroups(rows);
    let selection = normaliseSelection(getCurriculumSelection(child.id, subject));
    if (!hasSelection(selection)) {
      selection = buildAutoSelection(groups, currentWeek);
      setCurriculumSelection(child.id, subject, selection);
    } else {
      selection = syncMainSelection(selection, groups);
    }

    const futureSubs = new Set();
    const futureMains = new Set();
    Object.entries(groups).forEach(([main, entries]) => {
      entries.forEach(entry => {
        const weekValue = parseEstimatedWeek(entry.estimatedWeek);
        if (weekValue && weekValue > currentWeek) {
          const sub = entry.sub || 'General';
          futureSubs.add(`${main}|||${sub}`);
          futureMains.add(main);
        }
      });
    });

    const isFutureKey = (main, sub) => futureSubs.has(`${main}|||${sub}`);

    const confirmFutureSelection = () => new Promise(resolve => {
      if (window.__oakwoodFutureTopicsRemember) {
        resolve(true);
        return;
      }
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <h2 class="h2">Future Topics Selected</h2>
          <p class="help" style="margin-top: var(--space-2);">
            Some selected topics are scheduled for future weeks and may be more advanced. Include them anyway?
          </p>
          <label class="check" style="margin-top: var(--space-2);">
            <input type="checkbox" data-role="remember" />
            Remember this session
          </label>
          <div class="actions-row" style="margin-top: var(--space-3);">
            <button type="button" class="button-secondary" data-role="cancel">Cancel</button>
            <button type="button" class="button" data-role="confirm">Continue anyway</button>
          </div>
        </div>
      `;
      const close = result => {
        overlay.remove();
        resolve(result);
      };
      overlay.querySelector('[data-role="cancel"]').addEventListener('click', () => close(false));
      overlay.querySelector('[data-role="confirm"]').addEventListener('click', () => {
        const remember = overlay.querySelector('[data-role="remember"]').checked;
        if (remember) window.__oakwoodFutureTopicsRemember = true;
        close(true);
      });
      document.body.appendChild(overlay);
    });

    let showSubtopics = true;

    const render = () => {
      body.innerHTML = `
        ${weekBanner}
        <div class="curriculum-toolbar">
          <label class="check curriculum-toggle">
            <input type="checkbox" data-role="toggle-subtopics" ${showSubtopics ? 'checked' : ''} />
            Show subtopics
          </label>
          <div class="actions-row" style="margin-top: 0;">
            <button type="button" class="button-secondary" data-role="select-all">Select all</button>
            <button type="button" class="button-secondary" data-role="clear-all">Clear all</button>
          </div>
        </div>
        <div class="curriculum-table-head"></div>
        <div class="curriculum-scroll-area">
          <div class="curriculum-table-body"></div>
        </div>
      `;

      const tableHead = body.querySelector('.curriculum-table-head');
      const tableBody = body.querySelector('.curriculum-table-body');
      if (!Object.keys(groups).length) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '<p class="help">No topics available.</p>';
        return;
      }

      let rowsMarkup = '';
      if (showSubtopics) {
        const flatRows = [];
        Object.entries(groups).forEach(([main, entries]) => {
          entries.forEach(entry => {
            flatRows.push({
              main,
              sub: entry.sub || 'General',
              estimatedWeek: entry.estimatedWeek || '-',
              difficulty: entry.difficulty || '-',
              weekValue: parseEstimatedWeek(entry.estimatedWeek)
            });
          });
        });
        flatRows.sort((a, b) => {
          const main = a.main.localeCompare(b.main);
          if (main !== 0) return main;
          const wa = a.weekValue || 999;
          const wb = b.weekValue || 999;
          if (wa !== wb) return wa - wb;
          return a.sub.localeCompare(b.sub);
        });
        rowsMarkup = flatRows.map(item => {
          const checked = Boolean(selection.sub?.[item.main]?.[item.sub]);
          const weekValue = item.weekValue;
          const isFuture = weekValue && weekValue > currentWeek;
          const statusClass = weekValue ? (weekValue <= currentWeek ? ' is-complete' : ' is-future') : '';
          const badge = isFuture
            ? `<span class="future-badge" title="Scheduled for later – may be advanced.">${clockIcon}<span>Future</span></span>`
            : '';
          const diffNum = Number(item.difficulty);
          const diffClass = Number.isFinite(diffNum) ? (diffNum <= 1 ? 'diff-easy' : diffNum === 2 ? 'diff-medium' : 'diff-hard') : '';
          return `
            <tr class="curriculum-row${statusClass}">
              <td class="main-topic-cell">${toProperCase(item.main)}</td>
              <td class="subtopic-cell">${toSentenceCase(item.sub)}</td>
              <td class="week-cell">${item.estimatedWeek || '-'}</td>
              <td class="difficulty-cell ${diffClass}">${item.difficulty || '-'}</td>
              <td class="select-cell-wrapper">
                <div class="select-cell">
                  <input type="checkbox" data-role="sub-toggle" data-main="${item.main}" data-sub="${item.sub}" ${checked ? 'checked' : ''} />
                  ${badge}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      } else {
        const mainRows = Object.entries(groups).map(([main, entries]) => {
          const subs = unique(entries.map(e => e.sub || 'General'));
          const weeks = entries.map(e => parseEstimatedWeek(e.estimatedWeek)).filter(Boolean);
          const weekLabel = weeks.length ? (Math.min(...weeks) === Math.max(...weeks)
            ? `${Math.min(...weeks)}`
            : `${Math.min(...weeks)}-${Math.max(...weeks)}`) : '-';
          const diffs = entries.map(e => Number(e.difficulty)).filter(n => Number.isFinite(n));
          const diffLabel = diffs.length ? (Math.min(...diffs) === Math.max(...diffs)
            ? `${Math.min(...diffs)}`
            : `${Math.min(...diffs)}-${Math.max(...diffs)}`) : '-';
          const checked = Boolean(selection.main?.[main]);
          return {
            main,
            subCount: subs.length,
            weekLabel,
            diffLabel,
            checked,
            weekValue: weeks.length ? Math.min(...weeks) : null
          };
        }).sort((a, b) => a.main.localeCompare(b.main));
        rowsMarkup = mainRows.map(item => {
          const hasFuture = futureMains.has(item.main);
          const statusClass = item.weekValue ? (item.weekValue <= currentWeek ? ' is-complete' : ' is-future') : '';
          const badge = hasFuture
            ? `<span class="future-badge" title="Scheduled for later – may be advanced.">${clockIcon}<span>Future</span></span>`
            : '';
          return `
            <tr class="curriculum-row${statusClass}">
              <td class="main-topic-cell">${toProperCase(item.main)}</td>
              <td class="subtopic-cell">${item.subCount} Subtopics</td>
              <td class="week-cell">${item.weekLabel}</td>
              <td class="difficulty-cell">${item.diffLabel}</td>
              <td class="select-cell-wrapper">
                <div class="select-cell">
                  <input type="checkbox" data-role="main-toggle" data-main="${item.main}" ${item.checked ? 'checked' : ''} />
                  ${badge}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }

      const headerMarkup = `
        <table class="curriculum-table is-header">
          <colgroup>
            <col style="width:16%">
            <col style="width:50%">
            <col style="width:11%">
            <col style="width:11%">
            <col style="width:12%">
          </colgroup>
          <thead>
            <tr>
              <th>Main Topic</th>
              <th>${showSubtopics ? 'Subtopic' : 'Subtopics'}</th>
              <th>Week</th>
              <th>Difficulty</th>
              <th>Select</th>
            </tr>
          </thead>
        </table>
      `;
      const bodyMarkup = `
        <table class="curriculum-table">
          <colgroup>
            <col style="width:16%">
            <col style="width:50%">
            <col style="width:11%">
            <col style="width:11%">
            <col style="width:12%">
          </colgroup>
          <tbody>${rowsMarkup}</tbody>
        </table>
      `;
      tableHead.innerHTML = headerMarkup;
      tableBody.innerHTML = bodyMarkup;

      const toggle = body.querySelector('[data-role="toggle-subtopics"]');
      toggle.addEventListener('change', () => {
        showSubtopics = toggle.checked;
        render();
      });

      body.querySelector('[data-role="select-all"]').addEventListener('click', async () => {
        if (futureSubs.size && !window.__oakwoodFutureTopicsRemember) {
          const ok = await confirmFutureSelection();
          if (!ok) return;
        }
        const next = { main: {}, sub: {} };
        Object.entries(groups).forEach(([main, entries]) => {
          const subs = unique(entries.map(e => e.sub || 'General'));
          if (!next.sub[main]) next.sub[main] = {};
          subs.forEach(sub => { next.sub[main][sub] = true; });
          next.main[main] = true;
        });
        selection = next;
        setCurriculumSelection(child.id, subject, selection);
        render();
      });

      body.querySelector('[data-role="clear-all"]').addEventListener('click', () => {
        selection = { main: {}, sub: {} };
        setCurriculumSelection(child.id, subject, selection);
        render();
      });

      tableBody.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', async e => {
          const role = e.target.getAttribute('data-role');
          const main = e.target.getAttribute('data-main');
          const sub = e.target.getAttribute('data-sub');
          if (!main) return;
          const next = normaliseSelection(selection);
          const entries = groups[main] || [];
          const subs = unique(entries.map(entry => entry.sub || 'General'));

          if (role === 'main-toggle') {
            if (e.target.checked && futureMains.has(main) && !window.__oakwoodFutureTopicsRemember) {
              const ok = await confirmFutureSelection();
              if (!ok) {
                render();
                return;
              }
            }
            if (!next.sub[main]) next.sub[main] = {};
            subs.forEach(s => { next.sub[main][s] = e.target.checked; });
            next.main[main] = e.target.checked;
          }

          if (role === 'sub-toggle' && sub) {
            if (e.target.checked && isFutureKey(main, sub) && !window.__oakwoodFutureTopicsRemember) {
              const ok = await confirmFutureSelection();
              if (!ok) {
                render();
                return;
              }
            }
            if (!next.sub[main]) next.sub[main] = {};
            next.sub[main][sub] = e.target.checked;
            const allSelected = subs.length ? subs.every(s => next.sub?.[main]?.[s]) : e.target.checked;
            next.main[main] = allSelected;
          }

          selection = next;
          setCurriculumSelection(child.id, subject, selection);
          render();
        });
      });
    };

    render();
  };

  if (!subject) {
    titleEl.textContent = `${toProperCase(child.name) || 'Student'} - Subjects`;
    subtitleEl.textContent = 'Choose A Subject To View The Full Curriculum.';
    renderSubjectPicker();
  } else {
    titleEl.textContent = `${toProperCase(child.name) || 'Student'} - ${toProperCase(subject)}`;
    subtitleEl.textContent = `Year ${year || '-'} Curriculum Topics From The National Curriculum File.`;
    renderSubjectPage();
  }

  return section;
}
