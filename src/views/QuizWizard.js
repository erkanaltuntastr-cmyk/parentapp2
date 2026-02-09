import { getActiveChild, getCurriculumSelection } from '../usecases/children.js';
import { listSubjects } from '../usecases/subjects.js';
import { getTopics, loadCurriculum } from '../usecases/curriculum.js';
import { getMockTopics } from '../usecases/mockCurriculum.js';
import { getMockFeedback } from '../usecases/mockAi.js';
import { callAI, createQuizFeedbackPrompt } from '../usecases/aiService.js';
import { createPrompt } from '../utils/quizPrompt.js';
import { createQuizDraft, createSessionFromDraft, updateQuizDraft } from '../usecases/quizzes.js';
import { toast } from '../utils/toast.js';

function unique(list){
  return Array.from(new Set(list.filter(Boolean)));
}

export function QuizWizard(){
  const page = document.createElement('div');
  page.className = 'quiz-wizard-page';
  const section = document.createElement('section');
  section.className = 'card quiz-wizard';
  page.appendChild(section);

  const child = getActiveChild();
  if (!child) {
    location.hash = '#/add-child';
    return page;
  }

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const subjectParam = params.get('subject') || '';

  let mode = 'automatic';
  let preset = 'weekly';
  let subject = subjectParam ? decodeURIComponent(subjectParam) : '';
  let topics = [];
  let selectedGroups = [];
  let showTopics = false;
  let step = 1;
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
      topics = [];
      selectedGroups = [];
      renderTopics();
      return;
    }
    await loadCurriculum();
    let list = await getTopics(child.year, subject);
    if (!list.length) {
      list = await getMockTopics(child.year, subject);
    }

    const selection = getCurriculumSelection(child.id, subject);
    if (!selection || (!Object.keys(selection.main || {}).length && !Object.keys(selection.sub || {}).length)) {
      topics = [];
      selectedGroups = [];
      renderTopics();
      return;
    }

    const groupMap = new Map();
    list.forEach(t => {
      const main = (t.mainTopic || t.subject || subject).trim();
      const sub = (t.subtopic || 'General').trim();
      const hasMain = Boolean(selection.main?.[main]);
      const hasSub = Boolean(selection.sub?.[main]?.[sub]);
      if (!hasMain && !hasSub) return;
      if (!groupMap.has(main)) groupMap.set(main, new Set());
      groupMap.get(main).add(sub);
    });

    selectedGroups = Array.from(groupMap.entries()).map(([main, subs]) => ({
      main,
      subs: Array.from(subs)
    }));
    topics = selectedGroups.flatMap(group => group.subs.map(sub => `${group.main} - ${sub}`));
    renderTopics();
  };

  const buildSummary = () => {
    if (!selectedGroups.length) return 'Selected: none';
    const parts = selectedGroups.map(group => `${group.main} (${group.subs.length})`);
    return `Selected: ${parts.join(', ')}`;
  };

  const renderTopics = () => {
    const topicWrap = section.querySelector('[data-role="topic-list"]');
    const summaryEl = section.querySelector('[data-role="topic-summary"]');
    if (!topicWrap) return;
    if (summaryEl) summaryEl.textContent = buildSummary();
    const totalCount = topics.length || 0;
    if (!showTopics) {
      topicWrap.innerHTML = `<p class="help">${totalCount} topics selected.</p>`;
      return;
    }
    if (!selectedGroups.length) {
      topicWrap.innerHTML = `
        <p class="help">No topics selected. Return to the subject page to choose topics.</p>
        <a class="button-secondary" href="#/subject?subject=${encodeURIComponent(subject || '')}">Edit topics</a>
      `;
      return;
    }
    topicWrap.innerHTML = selectedGroups.map(group => `
      <details class="topic-accordion">
        <summary>${group.main} (${group.subs.length})</summary>
        <div class="topic-subgrid">
          ${group.subs.map(sub => `<span class="topic-chip is-readonly">${sub}</span>`).join('')}
        </div>
      </details>
    `).join('');
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

    const btn = section.querySelector('[data-role="send-ai"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Calling AI...';

    try {
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

      const aiResult = await callAI({
        childId: child.id,
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: createQuizFeedbackPrompt(
          subject,
          config.difficulty || 'Medium',
          `Year ${child.year || '-'}`
        ),
      });

      if (aiResult.success) {
        const feedbackPanel = section.querySelector('[data-role="feedback"]');
        feedbackPanel.innerHTML = `
          <div class="feedback-content">
            <h3 class="h3">AI Feedback</h3>
            <div class="feedback-text">${aiResult.content}</div>
            <div class="feedback-meta"><small>Tokens: ${aiResult.tokens.total} | Remaining: ${aiResult.rateLimit.remaining}</small></div>
          </div>
        `;
        feedbackPanel.style.display = 'block';
        toast.success('AI feedback received! 🎯');

        const draft = createQuizDraft({
          childId: child.id,
          subject,
          topics,
          mode,
          config,
          prompt
        });
        activeDraft = draft;
      }
    } catch (error) {
      console.error('AI Error:', error);
      const msg = error.message || 'Failed to get AI feedback';

      if (msg.includes('Rate limited')) {
        toast.error('1 request per minute per student');
      } else if (msg.includes('not configured')) {
        toast.error('Start server: npm --prefix server run dev');
      } else {
        toast.error(msg);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
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

  const renderFeedback = (feedback, prompt, applied = false) => {
    if (!feedbackPanel) feedbackPanel = section.querySelector('[data-role="feedback"]');
    if (!feedbackPanel) return;
    const suggestions = feedback.suggestions || [];
    const severity = suggestions.length ? 'amber' : 'green';
    feedbackPanel.innerHTML = `
      <div class="review-card ${severity}">
        <h3 class="h3">Pedagogical Review</h3>
        <p class="help">${feedback.feedback || 'No feedback available.'}</p>
        ${suggestions.length ? `
              <ul class="suggest-list">
                ${suggestions.map(item => `
                  <li>
                    <label class="check">
                      <input type="checkbox" disabled ${applied ? 'checked' : ''} />
                      <span>${item}</span>
                    </label>
                  </li>
                `).join('')}
              </ul>
            ` : '<p class="help">No suggestions. Ready to proceed.</p>'}
        <details class="prompt-accordion">
          <summary>Prompt Preview</summary>
          <pre>${prompt}</pre>
        </details>
        <div class="actions-row review-actions">
          <button type="button" class="button is-success" data-role="apply-suggestions">Apply Suggestions</button>
          <button type="button" class="button is-amber" data-role="proceed">Proceed Anyway</button>
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
      renderFeedback(feedback, updatedPrompt, true);
    });
    feedbackPanel.querySelector('[data-role="proceed"]').addEventListener('click', () => {
      if (!activeDraft) return;
      const session = createSessionFromDraft(activeDraft);
      location.hash = `#/quiz-session?id=${session.id}`;
    });
  };

  const subjectOptions = listSubjects(child.id, { includePassive: true })
    .sort((a, b) => (a.active === b.active ? a.name.localeCompare(b.name) : a.active ? -1 : 1));

  if (!subject && subjectOptions.length) {
    subject = subjectOptions[0].name;
  }

  const pupilName = (child.name || 'Student').trim() || 'Student';
  const yearLabel = child.year ? `Year ${child.year}` : 'Year -';
  const subtitleText = subject
    ? `${subject} - for ${pupilName}, ${yearLabel}`
    : `For ${pupilName}, ${yearLabel}`;

  section.innerHTML = `
    <h1 class="h1">Quiz Wizard</h1>
    <p class="subtitle">${subtitleText}</p>

    <div class="wizard-top">
      <div class="field">
        <div class="static-field">${subject || 'Subject not set'}</div>
      </div>
    </div>

    <div class="wizard-step is-active" data-step="1">
      <div class="wizard-modes">
        <button type="button" class="mode-card${mode === 'automatic' ? ' is-selected' : ''}" data-mode="automatic">
          <div class="mode-card-header">
            <div class="mode-icon">⚡</div>
          </div>
          <div class="mode-card-body">
            <h3 class="h3">Automatic</h3>
            <p class="help">Pre-set quizzes by difficulty level</p>
            <div class="mode-card-footer">Start →</div>
          </div>
        </button>
        <button type="button" class="mode-card${mode === 'quick' ? ' is-selected' : ''}" data-mode="quick">
          <div class="mode-card-header">
            <div class="mode-icon">⚙️</div>
          </div>
          <div class="mode-card-body">
            <h3 class="h3">Quick Settings</h3>
            <p class="help">Customize in seconds</p>
            <div class="mode-card-footer">Start →</div>
          </div>
        </button>
        <button type="button" class="mode-card${mode === 'expert' ? ' is-selected' : ''}" data-mode="expert">
          <div class="mode-card-header">
            <div class="mode-icon">🎯</div>
          </div>
          <div class="mode-card-body">
            <h3 class="h3">Expert</h3>
            <p class="help">Full control over all options</p>
            <div class="mode-card-footer">Start →</div>
          </div>
        </button>
      </div>

      <div class="wizard-panel" data-panel="automatic">
        <div class="preset-grid">
          ${Object.entries(presets).map(([key, item]) => `
            <button type="button" class="preset-card${key === preset ? ' is-selected' : ''}" data-preset="${key}">
              <div class="preset-card-header">🏆</div>
              <div class="preset-card-body">
                <h3 class="h3">${item.label}</h3>
                <p class="help">${item.counts.multipleChoice + item.counts.gapFill + item.counts.openEnded} questions</p>
                <p class="help">Timer ${item.timer} min</p>
                <div class="preset-card-footer">Start →</div>
              </div>
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

      <div class="step-actions"></div>
    </div>

    <div class="wizard-step" data-step="2">
      <div class="topic-section">
        <div class="topic-head">
          <div>
            <h2 class="h2">Topics</h2>
            <div class="topic-summary" data-role="topic-summary"></div>
          </div>
          <div class="topic-head-actions">
            <label class="check">
              <input type="checkbox" data-role="toggle-topics" ${showTopics ? 'checked' : ''} />
              Show selected topics
            </label>
            <a class="button-secondary" href="#/subject?subject=${encodeURIComponent(subject || '')}">Edit topics</a>
          </div>
        </div>
        <div class="topic-list topic-scroll" data-role="topic-list"></div>
      </div>
      <div class="step-actions">
        <button type="button" class="button-secondary" data-step-prev="1">Back</button>
        <button type="button" class="button" data-step-next="3">Continue</button>
      </div>
    </div>

    <div class="wizard-step" data-step="3">
      <div class="field" style="margin-top: var(--space-3);">
        <label for="wizardInstructions">Special Instructions</label>
        <textarea id="wizardInstructions" rows="3" placeholder="e.g., Focus on vocabulary, include real-life examples"></textarea>
      </div>
      <div class="step-actions">
        <button type="button" class="button-secondary" data-step-prev="2">Back</button>
        <button type="button" class="button" data-role="send-ai">Send to AI</button>
      </div>
    </div>

    <div class="feedback-panel" data-role="feedback"></div>
  `;

  const footer = document.createElement('div');
  footer.className = 'wizard-footer';
  footer.innerHTML = '<a class="button-secondary" href="#/family-hub">Back to Family Hub</a>';
  page.appendChild(footer);

  const setStep = next => {
    step = next;
    section.querySelectorAll('.wizard-step').forEach(panel => {
      panel.classList.toggle('is-active', panel.getAttribute('data-step') === String(step));
    });
  };

  section.querySelectorAll('[data-step-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = Number(btn.getAttribute('data-step-next'));
      if (Number.isFinite(next)) setStep(next);
    });
  });

  section.querySelectorAll('[data-step-prev]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = Number(btn.getAttribute('data-step-prev'));
      if (Number.isFinite(next)) setStep(next);
    });
  });

  setStep(step);

  section.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.getAttribute('data-mode');
      section.querySelectorAll('.mode-card').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      section.querySelectorAll('.wizard-panel').forEach(panel => {
        panel.classList.toggle('is-open', panel.getAttribute('data-panel') === mode);
      });
      setStep(2);
    });
  });

  section.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      preset = btn.getAttribute('data-preset');
      section.querySelectorAll('.preset-card').forEach(card => card.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });

  if (subject) {
    buildTopicList();
  } else {
    renderTopics();
  }

  const toggleTopics = section.querySelector('[data-role="toggle-topics"]');
  if (toggleTopics) {
    toggleTopics.addEventListener('change', e => {
      showTopics = e.target.checked;
      renderTopics();
    });
  }

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

  return page;
}

