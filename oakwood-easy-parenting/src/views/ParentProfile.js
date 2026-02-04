import { updateParentProfile, getActiveUser } from '../usecases/auth.js';

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

function parseDob(dob){
  const m = String(dob || '').trim().match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function calcAge(d){
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export function ParentProfile(){
  const section = document.createElement('section');
  section.className = 'card';
  const user = getActiveUser();
  if (!user) {
    location.hash = '#/signin';
    return section;
  }

  section.innerHTML = `
    <h1 class="h1">Parent Profile</h1>
    <p class="subtitle">Tell us about yourself to personalise guidance.</p>

    <form class="form">
      <div class="field">
        <label for="firstName">Name</label>
        <input id="firstName" name="firstName" type="text" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="lastName">Surname</label>
        <input id="lastName" name="lastName" type="text" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="postcode">Postcode</label>
        <input id="postcode" name="postcode" type="text" autocomplete="off" required />
      </div>

      <div class="field">
        <label for="dob">Date of Birth (DD / MM / YYYY)</label>
        <input id="dob" name="dob" type="text" inputmode="numeric" placeholder="DD / MM / YYYY" pattern="^\\d{2}\\s*/\\s*\\d{2}\\s*/\\s*\\d{4}$" required />
      </div>

      <div class="field">
        <label for="gsm">GSM (optional)</label>
        <input id="gsm" name="gsm" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="profession">Profession (optional)</label>
        <input id="profession" name="profession" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="place">Place of birth (optional)</label>
        <input id="place" name="place" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="gender">Gender (optional)</label>
        <select id="gender" name="gender">
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
        </select>
      </div>

      <div class="field">
        <label>Avatar</label>
        <div class="actions-row">
          <button type="button" class="button-secondary" data-avatar="selfie">Take Selfie</button>
          <button type="button" class="button-secondary" data-avatar="upload">Upload Photo</button>
          <button type="button" class="button-secondary" data-avatar="icon">Select Icon</button>
        </div>
        <small class="help">Default: genderless icon.</small>
      </div>

      <div class="field">
        <label for="aiBio">Parental Insights & AI Context</label>
        <textarea id="aiBio" name="aiBio" rows="4" placeholder=""></textarea>
      </div>

      <div class="actions-row">
        <button type="submit" class="button">Save Profile</button>
      </div>
    </form>
  `;

  let avatarType = 'icon';
  const form = section.querySelector('form');
  const aiBio = form.aiBio;
  attachDobMask(form.dob);

  const updatePlaceholder = () => {
    const first = form.firstName.value.trim();
    const last = form.lastName.value.trim();
    const place = form.place.value.trim();
    const dob = parseDob(form.dob.value.trim());
    const age = calcAge(dob);
    const bits = [];
    if (age) bits.push(`I am a ${age} year old parent`);
    else bits.push('I am a parent');
    if (place) bits.push(`born in ${place}`);
    if (first || last) bits.push(`named ${[first, last].filter(Boolean).join(' ')}`);
    aiBio.placeholder = bits.join(' ') + '.';
  };

  ['firstName', 'lastName', 'place', 'dob'].forEach(id => {
    form[id].addEventListener('input', updatePlaceholder);
  });
  updatePlaceholder();

  section.querySelectorAll('[data-avatar]').forEach(btn => {
    btn.addEventListener('click', () => {
      avatarType = btn.getAttribute('data-avatar') || 'icon';
      section.querySelectorAll('[data-avatar]').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const profile = {
      name: form.firstName.value.trim(),
      surname: form.lastName.value.trim(),
      postcode: form.postcode.value.trim(),
      dob: form.dob.value.replace(/\s/g, '').trim(),
      gsm: form.gsm.value.trim(),
      profession: form.profession.value.trim(),
      placeOfBirth: form.place.value.trim(),
      gender: form.gender.value,
      aiBio: form.aiBio.value.trim(),
      avatarType
    };

    if (!profile.name || !profile.surname || !profile.postcode || !profile.dob) {
      alert('Please complete all required fields.');
      return;
    }

    updateParentProfile(profile);
    location.hash = '#/select-child';
  });

  return section;
}
