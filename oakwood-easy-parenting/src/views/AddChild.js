import { addChild } from '../usecases/children.js';
import { loadCsvSchools } from '../lib/loadCsv.js';
import { getParent, setParent } from '../usecases/parent.js';
import { ICONS } from '../utils/icons.js';
import { attachPasswordToggles } from '../utils/passwordToggle.js';

function attachDobMask(input){
  const format = value => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8);
    const parts = [];
    if (digits.length >= 2) parts.push(digits.slice(0, 2));
    else if (digits.length) parts.push(digits);
    if (digits.length >= 4) parts.push(digits.slice(2, 4));
    else if (digits.length > 2) parts.push(digits.slice(2));
    if (digits.length > 4) parts.push(digits.slice(4));
    return parts.join(' / ');
  };
  input.addEventListener('input', () => {
    const next = format(input.value);
    if (next !== input.value) input.value = next;
  });
  input.addEventListener('paste', e => {
    const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    const digits = text.replace(/\D/g, '');
    if (digits.length === 8) {
      e.preventDefault();
      input.value = format(digits);
    }
  });
}

export function AddChild(){
  const section = document.createElement('section');
  section.className = 'card';

  const parent = getParent();
  const needsParent = !parent;

  const parentBlock = needsParent ? `
      <div class="parent-setup">
        <h2 class="h2">One-time Setup: Parent Information (Required for first child)</h2>
        <div class="field">
          <label for="parentName">Name</label>
          <input id="parentName" name="parentName" type="text" autocomplete="off" required />
        </div>
        <div class="field">
          <label for="parentSurname">Surname</label>
          <input id="parentSurname" name="parentSurname" type="text" autocomplete="off" required />
        </div>
        <div class="field">
          <label for="parentPostcode">Postcode</label>
          <input id="parentPostcode" name="parentPostcode" type="text" autocomplete="off" required />
        </div>
        <div class="field">
          <label for="parentDob">Date of Birth (DD / MM / YYYY)</label>
          <input id="parentDob" name="parentDob" type="text" inputmode="numeric" placeholder="DD / MM / YYYY" pattern="^\\d{2}\\s*/\\s*\\d{2}\\s*/\\s*\\d{4}$" required />
        </div>
        <div class="field">
          <label for="parentGsm">GSM (optional)</label>
          <input id="parentGsm" name="parentGsm" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="parentProfession">Profession (optional)</label>
          <input id="parentProfession" name="parentProfession" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="parentPlace">Place of Birth (optional)</label>
          <input id="parentPlace" name="parentPlace" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="parentGender">Gender (optional)</label>
          <select id="parentGender" name="parentGender">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="nonbinary">Non-binary</option>
          </select>
        </div>
        <div class="field">
          <label for="parentBio">Parental Insights & AI Context</label>
          <textarea id="parentBio" name="parentBio" rows="3" maxlength="500" placeholder=""></textarea>
          <small class="help">Add details about learning style, strengths, or challenges. This helps our AI give better advice later.</small>
        </div>
      </div>
  ` : '';

  section.innerHTML = `
    <h1 class="h1" id="add-child-title">Add Child</h1>
    <p class="subtitle" id="add-child-desc">Provide the basics. You can add more details later.</p>

    <form class="form" aria-labelledby="add-child-title" aria-describedby="add-child-desc">
      ${parentBlock}

      <div class="field">
        <label for="childName">Name</label>
        <input id="childName" name="childName" type="text" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="studentUsername">Student Username</label>
        <input id="studentUsername" name="studentUsername" type="text" autocomplete="off" minlength="5" required />
      </div>

      <div class="field password-field">
        <label for="studentPassword">Student Password (min 5 characters)</label>
        <div class="password-wrap">
          <input id="studentPassword" name="studentPassword" type="password" required />
          <button type="button" class="password-toggle" data-password-toggle="studentPassword" aria-label="Show password" aria-pressed="false"></button>
        </div>
      </div>

      <div class="field">
        <label for="dob">Date of Birth (DD / MM / YYYY)</label>
        <input id="dob" name="dob" type="text" inputmode="numeric" placeholder="DD / MM / YYYY" pattern="^\\d{2}\\s*/\\s*\\d{2}\\s*/\\s*\\d{4}$" required />
      </div>

      <div class="field">
        <label for="gender">Child Gender</label>
        <select id="gender" name="gender">
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
        </select>
      </div>

      <div class="field">
        <label>Child Icon</label>
        <div class="icon-grid">
          ${ICONS.map(i => `
            <button type="button" class="icon-btn" data-icon="${i.id}">
              <img src="${i.src}" alt="${i.id}" />
            </button>
          `).join('')}
        </div>
      </div>

      <div class="field">
        <label for="school">School name</label>
        <input id="school" name="school" type="text" autocomplete="off" placeholder="Free text" />
      </div>

      <div class="field">
        <label for="year">Year group</label>
        <input id="year" name="year" type="number" min="1" max="13" inputmode="numeric" placeholder="e.g., 4 or 7" required />
      </div>

      <div class="field">
        <label for="notes">Parental Insights & AI Context</label>
        <textarea id="notes" name="notes" rows="4" maxlength="500" placeholder="Add details about learning style, strengths, or challenges."></textarea>
        <small class="help">Add details about learning style, strengths, or challenges. This helps our AI give better advice later.</small>
      </div>

      <small class="help">All child data is stored locally on this device.</small>

      <div class="actions-row">
        <button type="submit" class="button" data-role="primary-cta">Save and continue</button>
        <a class="button-secondary" href="#/welcome">Cancel</a>
      </div>
    </form>
  `;

  const form = section.querySelector('form');
  attachPasswordToggles(section);
  const dobInput = section.querySelector('#dob');
  attachDobMask(dobInput);

  if (needsParent) {
    const parentDob = section.querySelector('#parentDob');
    attachDobMask(parentDob);
    const parentBio = section.querySelector('#parentBio');
    let autoBio = true;
    const buildBio = () => {
      const name = (form.parentName.value || '').trim();
      const prof = (form.parentProfession.value || '').trim();
      const place = (form.parentPlace.value || '').trim();
      const parts = [];
      if (name) parts.push(`I am ${name}`);
      else parts.push('I am a parent');
      if (prof) parts.push(`a ${prof}`);
      if (place) parts.push(`from ${place}`);
      return `${parts.join(', ')}. My goal is to support my child's growth and understand their school progress.`;
    };
    const maybeAuto = () => {
      if (!parentBio) return;
      if (!autoBio && parentBio.value.trim()) return;
      parentBio.value = buildBio();
      autoBio = true;
    };
    ['parentName', 'parentProfession', 'parentPlace'].forEach(id => {
      form[id].addEventListener('input', maybeAuto);
    });
    parentBio.addEventListener('input', () => {
      autoBio = parentBio.value.trim() === '';
    });
    maybeAuto();
  }

  let selectedIcon = ICONS[0].id;
  section.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedIcon = btn.getAttribute('data-icon') || ICONS[0].id;
      section.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });
  const defaultBtn = section.querySelector(`.icon-btn[data-icon="${selectedIcon}"]`);
  if (defaultBtn) defaultBtn.classList.add('is-selected');

  // School autocomplete (CSV index only, unique names, show [Postcode])
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
      const postcode = (item.postcode || '').trim();
      if (!name) continue;
      const label = postcode ? `${name} [${postcode}]` : name;
      const hay = `${name} ${postcode}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label });
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
      opt.textContent = item.label;
      opt.addEventListener('mousedown', e => {
        e.preventDefault();
        schoolInput.value = item.label;
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

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = (form.childName.value || '').trim();
    const dob = (form.dob.value || '').replace(/\s/g, '').trim();
    const gender = form.gender.value || '';
    const school = (form.school.value || '').trim();
    const year = Number(form.year.value || 0);
    const notes = (form.notes.value || '').trim();
    const studentUsername = (form.studentUsername.value || '').trim();
    const studentPassword = String(form.studentPassword.value || '');

    const errors = [];
    if (!name) errors.push('Name is required.');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) errors.push('Use DD/MM/YYYY.');
    if (!Number.isFinite(year) || year < 1 || year > 13) errors.push('Enter a valid Year (1-13).');
    if (studentUsername.length < 5) errors.push('Student username must be at least 5 characters.');
    if (studentPassword.length < 5) errors.push('Student password must be at least 5 characters.');

    if (needsParent) {
      const pName = (form.parentName.value || '').trim();
      const pSurname = (form.parentSurname.value || '').trim();
      const pPostcode = (form.parentPostcode.value || '').trim();
      const pDob = (form.parentDob.value || '').replace(/\s/g, '').trim();
      if (!pName || !pSurname || !pPostcode || !pDob) {
        errors.push('Complete all required parent fields.');
      } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(pDob)) {
        errors.push('Parent date of birth must be DD/MM/YYYY.');
      }
      if (!errors.length) {
        setParent({
          name: pName,
          surname: pSurname,
          postcode: pPostcode,
          dob: pDob,
          gsm: (form.parentGsm.value || '').trim(),
          profession: (form.parentProfession.value || '').trim(),
          placeOfBirth: (form.parentPlace.value || '').trim(),
          gender: form.parentGender.value || '',
          aiBio: (form.parentBio.value || '').trim()
        });
      }
    }

    if (errors.length) {
      alert(errors.join('\n'));
      return;
    }

    try {
      await addChild({ name, dob, school, year, gender, notes, iconId: selectedIcon, studentUsername, studentPassword });
      location.hash = '#/child-overview';
    } catch (err) {
      alert(err.message || 'Unable to add child.');
    }
  });

  return section;
}
