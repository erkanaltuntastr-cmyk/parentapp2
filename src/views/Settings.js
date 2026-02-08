import { exportData, importData } from '../usecases/dataPortability.js';
import { getFamilyName, setFamilyName } from '../usecases/family.js';
import { getState } from '../state/appState.js';
import { addTeacher, listTeachers } from '../usecases/teachers.js';

export function Settings(){
  const section = document.createElement('section');
  section.className = 'card';
  const familyName = getFamilyName();
  const children = getState().children || [];
  const teachers = listTeachers();

  section.innerHTML = `
    <h1 class="h1">Settings</h1>
    <p class="subtitle">Manage your local data.</p>

    <form class="form" data-role="family-form" style="margin-top: var(--space-3);">
      <div class="field">
        <label for="familyName">Family Name</label>
        <input id="familyName" name="familyName" type="text" value="${familyName.replace(/"/g, '&quot;')}" autocomplete="off" />
      </div>
      <div class="actions-row">
        <button type="submit" class="button-secondary">Save Family Name</button>
      </div>
    </form>

    <div class="teacher-section" style="margin-top: var(--space-4);">
      <h2 class="h2">Invite Teacher</h2>
      <form class="form" data-role="teacher-form">
        <div class="field">
          <label for="teacherName">Teacher Name</label>
          <input id="teacherName" name="teacherName" type="text" autocomplete="off" required />
        </div>
        <div class="field">
          <label for="teacherEmail">Teacher Email</label>
          <input id="teacherEmail" name="teacherEmail" type="text" autocomplete="off" required />
        </div>
        <div class="field">
          <label>Assign Students</label>
          <div class="checkbox-grid">
            ${children.map(c => `
              <label class="check">
                <input type="checkbox" name="teacherChild" value="${c.id}" />
                <span>${c.name || 'Student'}${c.school ? ` - ${c.school}` : ''}</span>
              </label>
            `).join('') || '<p class="help">Add a student to assign teachers.</p>'}
          </div>
        </div>
        <div class="actions-row">
          <button type="submit" class="button">Send Invite</button>
        </div>
      </form>
      <div class="teacher-list">
        <h3 class="h3">Assigned Teachers</h3>
        ${teachers.length ? teachers.map(t => `
          <div class="teacher-row">
            <div>
              <div class="teacher-name">${t.name || 'Teacher'}</div>
              <div class="help">${t.email || ''}</div>
            </div>
            <div class="help">${(t.childIds || []).length} student assigned</div>
          </div>
        `).join('') : '<p class="help">No teachers invited yet.</p>'}
      </div>
    </div>

    <div class="actions-row" style="margin-top: var(--space-3);">
      <button type="button" class="button" data-role="export-data">Export Data</button>
    </div>

    <div class="field" style="margin-top: var(--space-4);">
      <label for="importFile">Import Data</label>
      <input id="importFile" type="file" accept=".json,application/json" />
      <small class="help">This profile is stored on this device. If you forget your password, it cannot be recovered.</small>
    </div>

    <div style="margin-top: var(--space-3);">
      <a class="button-secondary" href="#/welcome">Back to welcome</a>
    </div>
  `;

  section.querySelector('[data-role="export-data"]').addEventListener('click', () => {
    exportData();
  });

  const familyForm = section.querySelector('[data-role="family-form"]');
  familyForm.addEventListener('submit', e => {
    e.preventDefault();
    setFamilyName(familyForm.familyName.value);
    alert('Family name saved.');
  });

  const teacherForm = section.querySelector('[data-role="teacher-form"]');
  teacherForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = teacherForm.teacherName.value;
    const email = teacherForm.teacherEmail.value;
    const selected = Array.from(teacherForm.querySelectorAll('input[name="teacherChild"]:checked')).map(i => i.value);
    if (!selected.length) {
      alert('Select at least one student.');
      return;
    }
    addTeacher({ name, email, childIds: selected });
    alert('Teacher invited.');
    location.reload();
  });

  const fileInput = section.querySelector('#importFile');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      await importData(file);
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Import failed.');
      fileInput.value = '';
    }
  });

  return section;
}
