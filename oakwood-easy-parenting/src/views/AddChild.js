import { addChild } from '../usecases/children.js';
import { loadCsvSchools } from '../lib/loadCsv.js';

export function AddChild(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1" id="add-child-title">Add Child</h1>
    <p class="subtitle" id="add-child-desc">Provide the basics. You can add more details later.</p>

    <form class="form" aria-labelledby="add-child-title" aria-describedby="add-child-desc">
      <div class="field">
        <label for="childName">Name</label>
        <input id="childName" name="childName" type="text" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="dob">Date of birth (DD/MM/YYYY)</label>
        <input id="dob" name="dob" type="text" inputmode="numeric" placeholder="DD/MM/YYYY" pattern="^\\d{2}/\\d{2}/\\d{4}$" required />
      </div>

      <div class="field">
        <label for="school">School name</label>
        <input id="school" name="school" type="text" autocomplete="off" placeholder="Free text" />
      </div>

      <div class="field">
        <label for="year">Year group</label>
        <input id="year" name="year" type="number" min="1" max="13" inputmode="numeric" placeholder="e.g., 4 or 7" required />
      </div>

      <small class="help">All child data is stored locally on this device.</small>

      <div class="actions-row">
        <button type="submit" class="button" data-role="primary-cta">Save and continue</button>
        <a class="button-secondary" href="#/welcome">Cancel</a>
      </div>
    </form>
  `;

  // DOB input mask + normalisation
  const dobInput = section.querySelector('#dob');
  const formatDob = value => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8);
    const parts = [];
    if (digits.length >= 2) parts.push(digits.slice(0, 2));
    else if (digits.length) parts.push(digits);
    if (digits.length >= 4) parts.push(digits.slice(2, 4));
    else if (digits.length > 2) parts.push(digits.slice(2));
    if (digits.length > 4) parts.push(digits.slice(4));
    return parts.join('/');
  };
  dobInput.addEventListener('input', () => {
    const next = formatDob(dobInput.value);
    if (next !== dobInput.value) dobInput.value = next;
  });
  dobInput.addEventListener('paste', e => {
    const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    const digits = text.replace(/\D/g, '');
    if (digits.length === 8) {
      e.preventDefault();
      dobInput.value = formatDob(digits);
    }
  });

  // School autocomplete (CSV index only, unique names)
  const schoolInput = section.querySelector('#school');
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete';
  dropdown.setAttribute('role', 'listbox');
  dropdown.hidden = true;
  schoolInput.parentNode.appendChild(dropdown);
  let activeIndex = -1;
  let debounceId;

  const ensureSchoolIndex = async () => {
    if (window.__oakwoodSchoolIndex === undefined) {
      const csv = await loadCsvSchools('data/gias_schools.csv');
      window.__oakwoodSchoolIndex = Array.isArray(csv) ? csv : [];
    }
  };

  const getMatches = query => {
    const q = (query || '').trim().toLowerCase();
    const list = window.__oakwoodSchoolIndex;
    if (!Array.isArray(list) || list.length === 0) return [];
    const seen = new Set();
    const out = [];
    for (const item of list) {
      const name = (item.name || '').trim();
      if (!name) continue;
      const hay = `${name} ${(item.postcode || '')}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
      if (out.length >= 8) break;
    }
    return out;
  };

  const renderSuggestions = query => {
    const matches = getMatches(query);
    dropdown.innerHTML = '';
    activeIndex = -1;
    if (!matches.length) {
      dropdown.hidden = true;
      return;
    }
    matches.forEach((item, idx) => {
      const opt = document.createElement('div');
      opt.className = 'autocomplete-item';
      opt.setAttribute('role', 'option');
      opt.setAttribute('data-index', String(idx));
      opt.textContent = item;
      opt.addEventListener('mousedown', e => {
        e.preventDefault();
        schoolInput.value = item;
        dropdown.hidden = true;
      });
      dropdown.appendChild(opt);
    });
    const foot = document.createElement('div');
    foot.className = 'autocomplete-foot';
    foot.textContent = 'From GIAS (DfE)';
    dropdown.appendChild(foot);
    dropdown.hidden = false;
  };

  const setActive = idx => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach(el => el.setAttribute('aria-selected', 'false'));
    if (items[idx]) {
      items[idx].setAttribute('aria-selected', 'true');
      activeIndex = idx;
    }
  };

  const scheduleRender = () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => renderSuggestions(schoolInput.value), 120);
  };

  schoolInput.addEventListener('focus', async () => {
    await ensureSchoolIndex();
    scheduleRender();
  });
  schoolInput.addEventListener('input', async () => {
    await ensureSchoolIndex();
    scheduleRender();
  });
  schoolInput.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (dropdown.hidden || !items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = activeIndex + 1 < items.length ? activeIndex + 1 : 0;
      setActive(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = activeIndex - 1 >= 0 ? activeIndex - 1 : items.length - 1;
      setActive(next);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        schoolInput.value = items[activeIndex].textContent || schoolInput.value;
        dropdown.hidden = true;
      }
    } else if (e.key === 'Escape') {
      dropdown.hidden = true;
    }
  });
  schoolInput.addEventListener('blur', () => {
    setTimeout(() => { dropdown.hidden = true; }, 100);
  });

  const form = section.querySelector('form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = (form.childName.value || '').trim();
    const dob = (form.dob.value || '').trim();
    const school = (form.school.value || '').trim();
    const year = Number(form.year.value || 0);

    const errors = [];
    if (!name) errors.push('Name is required.');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) errors.push('Use DD/MM/YYYY.');
    if (!Number.isFinite(year) || year < 1 || year > 13) errors.push('Enter a valid Year (1–13).');

    if (errors.length) {
      alert(errors.join('\n'));
      return;
    }

    addChild({ name, dob, school, year });
    location.hash = '#/child-overview';
  });

  return section;
}

