import { getActiveChild, getCurriculumSelection, setCurriculumSelection } from '../usecases/children.js';
import { getAvailableSubjects, getTopics, loadCurriculum } from '../usecases/curriculum.js';
import { parseEstimatedWeek, getCurrentYearWeek } from '../utils/schoolWeek.js';

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

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const subjectParam = params.get('subject') || params.get('name') || '';
  let subject = subjectParam || '';
  const year = child.year;
  const weekInfo = getCurrentYearWeek();

  section.innerHTML = `
    <h1 class="h1"></h1>
    <p class="subtitle"></p>
    <div class="curriculum-body"></div>
    <div class="actions-row" style="margin-top: var(--space-4);">
      <a class="button-secondary" href="#/child-overview">Back to Student Overview</a>
    </div>
  `;

  const titleEl = section.querySelector('.h1');
  const subtitleEl = section.querySelector('.subtitle');
  const body = section.querySelector('.curriculum-body');

  const renderSubjectPicker = async () => {
    body.innerHTML = '<p class="subtitle">Loading subjects...</p>';
    await loadCurriculum();
    const subjects = await getAvailableSubjects(year);
    if (!subjects.length) {
      body.innerHTML = '<p class="help">No subjects found for this year.</p>';
      return;
    }
    body.innerHTML = `
      <div class="week-banner">
        <div class="help">Current week (${weekInfo.year})</div>
        <div class="week-number">Week ${weekInfo.week}</div>
      </div>
      <div class="subject-boxes"></div>
    `;
    const wrap = body.querySelector('.subject-boxes');
    wrap.innerHTML = subjects
      .sort((a, b) => a.localeCompare(b))
      .map(name => `<button type="button" class="subject-box" data-subject="${name}">${name}</button>`)
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
      selection = buildAutoSelection(groups, weekInfo.week);
      setCurriculumSelection(child.id, subject, selection);
    } else {
      selection = syncMainSelection(selection, groups);
    }

    let showSubtopics = true;

    const render = () => {
      body.innerHTML = `
        <div class="week-banner">
          <div class="help">Current week (${weekInfo.year})</div>
          <div class="week-number">Week ${weekInfo.week}</div>
        </div>
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
        <div class="curriculum-table-wrap"></div>
      `;

      const tableWrap = body.querySelector('.curriculum-table-wrap');
      if (!Object.keys(groups).length) {
        tableWrap.innerHTML = '<p class="help">No topics available.</p>';
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
          const statusClass = weekValue ? (weekValue <= weekInfo.week ? ' is-complete' : ' is-future') : '';
          return `
            <tr class="curriculum-row${statusClass}">
              <td>${item.main}</td>
              <td>${item.sub}</td>
              <td>${item.estimatedWeek || '-'}</td>
              <td>${item.difficulty || '-'}</td>
              <td>
                <input type="checkbox" data-role="sub-toggle" data-main="${item.main}" data-sub="${item.sub}" ${checked ? 'checked' : ''} />
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
          const statusClass = item.weekValue ? (item.weekValue <= weekInfo.week ? ' is-complete' : ' is-future') : '';
          return `
            <tr class="curriculum-row${statusClass}">
              <td>${item.main}</td>
              <td>${item.subCount} subtopics</td>
              <td>${item.weekLabel}</td>
              <td>${item.diffLabel}</td>
              <td>
                <input type="checkbox" data-role="main-toggle" data-main="${item.main}" ${item.checked ? 'checked' : ''} />
              </td>
            </tr>
          `;
        }).join('');
      }

      tableWrap.innerHTML = `
        <table class="curriculum-table">
          <thead>
            <tr>
              <th>Main Topic</th>
              <th>${showSubtopics ? 'Subtopic' : 'Subtopics'}</th>
              <th>Estimated Week</th>
              <th>Difficulty</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
      `;

      const toggle = body.querySelector('[data-role="toggle-subtopics"]');
      toggle.addEventListener('change', () => {
        showSubtopics = toggle.checked;
        render();
      });

      body.querySelector('[data-role="select-all"]').addEventListener('click', () => {
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

      tableWrap.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', e => {
          const role = e.target.getAttribute('data-role');
          const main = e.target.getAttribute('data-main');
          const sub = e.target.getAttribute('data-sub');
          if (!main) return;
          const next = normaliseSelection(selection);
          const entries = groups[main] || [];
          const subs = unique(entries.map(entry => entry.sub || 'General'));

          if (role === 'main-toggle') {
            if (!next.sub[main]) next.sub[main] = {};
            subs.forEach(s => { next.sub[main][s] = e.target.checked; });
            next.main[main] = e.target.checked;
          }

          if (role === 'sub-toggle' && sub) {
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
    titleEl.textContent = `${child.name || 'Student'} - subjects`;
    subtitleEl.textContent = 'Choose a subject to view the full curriculum.';
    renderSubjectPicker();
  } else {
    titleEl.textContent = `${child.name || 'Student'} - ${subject}`;
    subtitleEl.textContent = `Year ${year || '-'} curriculum topics from the national curriculum file.`;
    renderSubjectPage();
  }

  return section;
}
