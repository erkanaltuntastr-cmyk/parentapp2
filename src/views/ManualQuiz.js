import { getActiveChild } from '../usecases/children.js';
import { listSubjects } from '../usecases/subjects.js';
import { parseManualQuiz } from '../utils/quizParser.js';
import { createQuizSession } from '../usecases/quizzes.js';
import { toast } from '../utils/toast.js';

export function ManualQuiz(){
  const section = document.createElement('section');
  section.className = 'card manual-quiz';

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  const subjects = listSubjects(child.id, { includePassive: true });

  section.innerHTML = `
    <h1 class="h1">Manual Quiz Creation</h1>
    <p class="subtitle">Paste text or upload a file to extract questions.</p>

    <div class="field">
      <label for="manualSubject">Subject</label>
      <select id="manualSubject">
        <option value="">Select a subject</option>
        ${subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
      </select>
    </div>

    <div class="field">
      <label for="manualTimer">Timer (minutes)</label>
      <input id="manualTimer" type="number" min="5" value="20" />
    </div>

    <label class="check"><input id="manualHints" type="checkbox" checked /> Enable hints</label>
    <label class="check"><input id="manualExplain" type="checkbox" checked /> Explain after answer</label>

    <div class="field">
      <label for="manualText">Paste Questions</label>
      <textarea id="manualText" rows="8" placeholder="Q: What is 7+5?&#10;A: 12"></textarea>
    </div>

    <div class="field">
      <label for="manualFile">Upload File (Mock)</label>
      <input id="manualFile" type="file" accept=".txt" />
    </div>

    <div class="actions-row">
      <button type="button" class="button" data-role="build">Create Quiz</button>
      <a class="button-secondary" href="#/family-hub">Back</a>
    </div>
  `;

  const textArea = section.querySelector('#manualText');
  const fileInput = section.querySelector('#manualFile');
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      textArea.value = String(e.target.result || '');
    };
    reader.readAsText(file);
  });

  section.querySelector('[data-role="build"]').addEventListener('click', () => {
    const subject = section.querySelector('#manualSubject').value || 'General';
    const timerMinutes = Number(section.querySelector('#manualTimer').value || 0);
    const includeHints = section.querySelector('#manualHints').checked;
    const includeExplanations = section.querySelector('#manualExplain').checked;
    const items = parseManualQuiz(textArea.value);
    if (!items.length) {
      toast.error('No questions detected. Paste or upload content first.');
      return;
    }
    const questions = items.map((item, idx) => ({
      ...item,
      id: `m_${Date.now()}_${idx}`,
      type: item.type || 'open-ended'
    }));
    const session = createQuizSession({
      childId: child.id,
      subject,
      topics: ['Manual Quiz'],
      mode: 'manual',
      config: { timerMinutes, includeHints, includeExplanations },
      questions,
      status: 'pending'
    });
    location.hash = `#/quiz-session?id=${session.id}`;
  });

  return section;
}
