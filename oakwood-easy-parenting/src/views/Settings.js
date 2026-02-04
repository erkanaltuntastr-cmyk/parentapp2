import { exportData, importData } from '../usecases/dataPortability.js';

export function Settings(){
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1 class="h1">Settings</h1>
    <p class="subtitle">Manage your local data.</p>

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
