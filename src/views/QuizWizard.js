import { getActiveChild } from '../usecases/children.js';
import { listSubjects } from '../usecases/subjects.js';
import { getTopics, loadCurriculum } from '../usecases/curriculum.js';
import { getMockTopics } from '../usecases/mockCurriculum.js';
import { getMockFeedback } from '../usecases/mockAi.js';
import { createPrompt } from '../utils/quizPrompt.js';
import { createQuizDraft, createSessionFromDraft, updateQuizDraft } from '../usecases/quizzes.js';
import { toast } from '../utils/toast.js';

function unique(list){
  return Array.from(new Set(list.filter(Boolean)));
}

export function QuizWizard(){
  const section = document.createElement('section');
  section.className = 'card quiz-wizard';

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return section;
  }

  let mode = 'automatic';
  let preset = 'weekly';
  let subject = '';
  let topics = [];
  let availableTopics = [];
  let feedbackPanel = null;
  let activeDraft = null;

  const presets = {
    weekly: { label: 'Weekly', counts: { multipleChoice: 7, gapFill: 3, openEnded: 2 }, difficulty: 'Medium', timer: 15, hints: true, explanations: true },
    exam: { label: 'Exam Prep', counts: { multipleChoice: 12, gapFill: 5, openEnded: 3 }, difficulty: 'Medium', timer: 30, hints: false, explanations: true },
    challenge: { label: 'Challenge', counts: { multipleChoice: 8, gapFill: 4, openEnded: 3 }, difficulty: 'Hard', timer: 25, hints: false, explanations: true }
  };

  const state = {
    quickTotal: 12,
    quickDifficulty: 'Medium',
    quickHints: true,
    quickExplanations: true,
    quickTimer: 20,
    expertCounts: { multipleChoice: 8, gapFill: 4, openEnded: 2 },
    expertOptions: 4,
    expertDifficulty: 'Medium',
    expertHints: true,
    expertExplanations: true,
    expertTimer: 25,
    instructions: ''
  };

  const buildTopicList = async () => {
    if (!subject) {
      availableTopics = [];
      topics = [];
      renderTopics();
      return;
    }
    await loadCurriculum();
    let list = await getTopics(child.year, subject);
    if (!list.length) {
      list = await getMockTopics(child.year, subject);
    }
    availableTopics = list.map(t => {
      const main = (t.mainTopic || t.subject || subject).trim();
      const sub = (t.subtopic || 'General').trim();
      const label = sub ? `${main} - ${sub}` : main;
      return { key: label, label };
    });
    topics = unique(availableTopics.map(t => t.key));
    renderTopics();
  };

  const renderTopics = () => {
    const topicWrap = section.querySelector('[data-role="topic-list"]');
    if (!topicWrap) return;
    if (!availableTopics.length) {
      topicWrap.innerHTML = '<p class="help">No topics available. Try another subject.</p>';
      return;
    }
    topicWrap.innerHTML = `
      ${availableTopics.map(item => `
        <label class="topic-chip">
          <input type="checkbox" ${topics.includes(item.key) ? 'checked' : ''} data-topic="${item.key}" />
          <span>${item.label}</span>
        </label>
      `).join('')}
    `;
    topicWrap.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', e => {
        const key = e.target.getAttribute('data-topic');
        if (!key) return;
        if (e.target.checked) {
          topics = unique([...topics, key]);
        } else {
          topics = topics.filter(t => t !== key);
        }
      });
    });
  };

  const buildConfig = () => {
    if (mode === 'automatic') {
      const presetConfig = presets[preset] || presets.weekly;
      return {
        counts: { ...presetConfig.counts },
        difficulty: presetConfig.difficulty,
        includeHints: presetConfig.hints,
        includeExplanations: presetConfig.explanations,
        optionsCount: 4,
        timerMinutes: presetConfig.timer
      };
    }
    if (mode === 'quick') {
      return {
        totalQuestions: Number(state.quickTotal || 0),
        difficulty: state.quickDifficulty,
        includeHints: state.quickHints,
        includeExplanations: state.quickExplanations,
        optionsCount: 4,
        timerMinutes: state.quickTimer
      };
    }
    return {
      counts: { ...state.expertCounts },
      difficulty: state.expertDifficulty,
      includeHints: state.expertHints,
      includeExplanations: state.expertExplanations,
      optionsCount: Number(state.expertOptions || 4),
      timerMinutes: state.expertTimer
    };
  };

  const handleSendToAi = async () => {
    if (!subject) {
      toast.error('Choose a subject first.');
      return;
    }
    if (!topics.length) {
      toast.error('Select at least one topic.');
      return;
    }
    const config = buildConfig();
    const total = (config.counts?.multipleChoice || 0)
      + (config.counts?.gapFill || 0)
      + (config.counts?.openEnded || 0)
      + (config.totalQuestions || 0);
    if (total <= 0) {
      toast.error('Set at least one question.');
      return;
    }
    const prompt = createPrompt({
      child,
      subject,
      topics,
      difficulty: config.difficulty,
      instructions: state.instructions,
      includeHints: config.includeHints,
      includeExplanations: config.includeExplanations,
      questionPlan: config.counts || { total: config.totalQuestions }
    });

    const draft = createQuizDraft({
      childId: child.id,
      subject,
      topics,
      mode,
      config,
      prompt
    });
    activeDraft = draft;

    const feedback = await getMockFeedback();
    renderFeedback(feedback, prompt);
  };

  const applySuggestions = (config, suggestions) => {
    const next = { ...config, counts: { ...(config.counts || {}) } };
    (suggestions || []).forEach(suggestion => {
      const s = suggestion.toLowerCase();
      if (s.includes('open-ended')) {
        next.counts.openEnded = Math.min(next.counts.openEnded || 0, 3);
      }
      if (s.includes('gap-fill')) {
        next.counts.gapFill = (next.counts.gapFill || 0) + 5;
      }
      if (s.includes('hints')) {
        next.includeHints = true;
      }
      if (s.includes('easier')) {
        next.difficulty = 'Easy';
      }
    });
    return next;
  };

  const renderFeedback = (feedback, prompt) => {
    if (!feedbackPanel) feedbackPanel = section.querySelector('[data-role="feedback"]');
    if (!feedbackPanel) return;
    feedbackPanel.innerHTML = `
      <div class="feedback-card">
        <h3 class="h3">Pedagogical Review</h3>
        <p class="help">${feedback.feedback || 'No feedback available.'}</p>
        ${feedback.suggestions && feedback.suggestions.length ? `
          <ul class="suggest-list">
            ${feedback.suggestions.map(item => `<li>${item}</li>`).join('')}
          </ul>
        ` : '<p class="help">No suggestions. Ready to proceed.</p>'}
        <div class="prompt-box">
          <div class="help">Prompt Preview</div>
          <pre>${prompt}</pre>
        </div>
        <div class="actions-row">
          <button type="button" class="button" data-role="apply-suggestions">Apply Suggestions</button>
          <button type="button" class="button-secondary" data-role="proceed">Proceed Anyway</button>
          <button type="button" class="button-secondary" data-role="back">Back to Edit</button>
        </div>
      </div>
    `;
    feedbackPanel.classList.add('is-open');

    feedbackPanel.querySelector('[data-role="back"]').addEventListener('click', () => {
      feedbackPanel.classList.remove('is-open');
    });
    feedbackPanel.querySelector('[data-role="apply-suggestions"]').addEventListener('click', () => {
      if (!activeDraft) return;
      const updatedConfig = applySuggestions(activeDraft.config || {}, feedback.suggestions || []);
      const updatedPrompt = `${activeDraft.prompt}\n\nApplied Suggestions: ${(feedback.suggestions || []).join('; ') || 'None'}`;
      updateQuizDraft(activeDraft.id, { config: updatedConfig, prompt: updatedPrompt });
      activeDraft = { ...activeDraft, config: updatedConfig, prompt: updatedPrompt };
      toast.success('Suggestions applied.');
      renderFeedback(feedback, updatedPrompt);
    });
    feedbackPanel.querySelector('[data-role="proceed"]').addEventListener('click', () => {
      if (!activeDraft) return;
      const session = createSessionFromDraft(activeDraft);
      location.hash = `#/quiz-session?id=${session.id}`;
    });
  };

  const subjectOptions = listSubjects(child.id, { includePassive: true })
    .sort((a, b) => (a.active === b.active ? a.name.localeCompare(b.name) : a.active ? -1 : 1));

  section.innerHTML = `
    <h1 class="h1">Quiz Wizard</h1>
    <p class="subtitle">Configure quizzes with automatic presets or expert controls.</p>

    <div class="wizard-top">
      <div class="field">
        <label for="wizardSubject">Subject</label>
        <select id="wizardSubject">
          <option value="">Select a subject</option>
          ${subjectOptions.map(s => `<option value="${s.name}">${s.name}${s.active ? '' : ' (Passive)'}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="wizardInstructions">Special Instructions</label>
        <textarea id="wizardInstructions" rows="2" placeholder="Optional notes for the AI"></textarea>
      </div>
    </div>

    <div class="wizard-tabs">
      <button type="button" class="tab-btn is-selected" data-mode="automatic">Automatic</button>
      <button type="button" class="tab-btn" data-mode="quick">Quick Settings</button>
      <button type="button" class="tab-btn" data-mode="expert">Expert</button>
    </div>

    <div class="wizard-panel is-open" data-panel="automatic">
      <div class="preset-grid">
        ${Object.entries(presets).map(([key, item]) => `
          <button type="button" class="preset-card${key === preset ? ' is-selected' : ''}" data-preset="${key}">
            <h3 class="h3">${item.label}</h3>
            <p class="help">${item.counts.multipleChoice + item.counts.gapFill + item.counts.openEnded} questions</p>
            <p class="help">Timer ${item.timer} min</p>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="wizard-panel" data-panel="quick">
      <div class="field">
        <label for="quickTotal">Total Questions</label>
        <input id="quickTotal" type="number" min="1" value="${state.quickTotal}" />
      </div>
      <div class="field">
        <label for="quickDifficulty">Difficulty</label>
        <select id="quickDifficulty">
          <option value="Easy">Easy</option>
          <option value="Medium" selected>Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>
      <div class="field">
        <label for="quickTimer">Timer (minutes)</label>
        <input id="quickTimer" type="number" min="5" value="${state.quickTimer}" />
      </div>
      <label class="check"><input id="quickHints" type="checkbox" checked /> Enable hints</label>
      <label class="check"><input id="quickExplain" type="checkbox" checked /> Explain after answer</label>
    </div>

    <div class="wizard-panel" data-panel="expert">
      <div class="expert-grid">
        <div class="field">
          <label for="expertMC">Multiple Choice</label>
          <input id="expertMC" type="number" min="0" value="${state.expertCounts.multipleChoice}" />
        </div>
        <div class="field">
          <label for="expertGap">Gap Fill</label>
          <input id="expertGap" type="number" min="0" value="${state.expertCounts.gapFill}" />
        </div>
        <div class="field">
          <label for="expertOpen">Open Ended</label>
          <input id="expertOpen" type="number" min="0" value="${state.expertCounts.openEnded}" />
        </div>
        <div class="field">
          <label for="expertOptions">MC Options (2-5)</label>
          <input id="expertOptions" type="number" min="2" max="5" value="${state.expertOptions}" />
        </div>
        <div class="field">
          <label for="expertDifficulty">Difficulty</label>
          <select id="expertDifficulty">
            <option value="Easy">Easy</option>
            <option value="Medium" selected>Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div class="field">
          <label for="expertTimer">Timer (minutes)</label>
          <input id="expertTimer" type="number" min="5" value="${state.expertTimer}" />
        </div>
      </div>
      <label class="check"><input id="expertHints" type="checkbox" checked /> Enable hints</label>
      <label class="check"><input id="expertExplain" type="checkbox" checked /> Explain after answer</label>
    </div>

    <div class="topic-section">
      <div class="topic-head">
        <h2 class="h2">Topics</h2>
        <button type="button" class="button-secondary" data-role="select-all">Select all</button>
      </div>
      <div class="topic-list" data-role="topic-list"></div>
    </div>

    <div class="actions-row" style="margin-top: var(--space-3);">
      <button type="button" class="button" data-role="send-ai">Send to AI</button>
      <a class="button-secondary" href="#/family-hub">Back to Family Hub</a>
    </div>

    <div class="feedback-panel" data-role="feedback"></div>
  `;

  section.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.getAttribute('data-mode');
      section.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      section.querySelectorAll('.wizard-panel').forEach(panel => {
        panel.classList.toggle('is-open', panel.getAttribute('data-panel') === mode);
      });
    });
  });

  section.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      preset = btn.getAttribute('data-preset');
      section.querySelectorAll('.preset-card').forEach(card => card.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });

  const subjectSelect = section.querySelector('#wizardSubject');
  subjectSelect.addEventListener('change', async () => {
    subject = subjectSelect.value;
    await buildTopicList();
  });

  section.querySelector('[data-role="select-all"]').addEventListener('click', () => {
    topics = unique(availableTopics.map(t => t.key));
    renderTopics();
  });

  section.querySelector('#wizardInstructions').addEventListener('input', e => {
    state.instructions = e.target.value;
  });

  section.querySelector('#quickTotal').addEventListener('input', e => {
    state.quickTotal = Number(e.target.value || 0);
  });
  section.querySelector('#quickDifficulty').addEventListener('change', e => {
    state.quickDifficulty = e.target.value;
  });
  section.querySelector('#quickTimer').addEventListener('input', e => {
    state.quickTimer = Number(e.target.value || 0);
  });
  section.querySelector('#quickHints').addEventListener('change', e => {
    state.quickHints = e.target.checked;
  });
  section.querySelector('#quickExplain').addEventListener('change', e => {
    state.quickExplanations = e.target.checked;
  });

  section.querySelector('#expertMC').addEventListener('input', e => {
    state.expertCounts.multipleChoice = Number(e.target.value || 0);
  });
  section.querySelector('#expertGap').addEventListener('input', e => {
    state.expertCounts.gapFill = Number(e.target.value || 0);
  });
  section.querySelector('#expertOpen').addEventListener('input', e => {
    state.expertCounts.openEnded = Number(e.target.value || 0);
  });
  section.querySelector('#expertOptions').addEventListener('input', e => {
    state.expertOptions = Number(e.target.value || 4);
  });
  section.querySelector('#expertDifficulty').addEventListener('change', e => {
    state.expertDifficulty = e.target.value;
  });
  section.querySelector('#expertTimer').addEventListener('input', e => {
    state.expertTimer = Number(e.target.value || 0);
  });
  section.querySelector('#expertHints').addEventListener('change', e => {
    state.expertHints = e.target.checked;
  });
  section.querySelector('#expertExplain').addEventListener('change', e => {
    state.expertExplanations = e.target.checked;
  });

  section.querySelector('[data-role="send-ai"]').addEventListener('click', handleSendToAi);

  return section;
}
