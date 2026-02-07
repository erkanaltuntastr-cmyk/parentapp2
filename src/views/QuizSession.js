import { getActiveUser } from '../usecases/auth.js';
import { getQuizSession, recordAnswer, completeQuizSession, updateQuizSession } from '../usecases/quizzes.js';
import { toast } from '../utils/toast.js';

export function QuizSession(){
  const section = document.createElement('section');
  section.className = 'quiz-session';

  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const id = params.get('id');
  const session = id ? getQuizSession(id) : null;
  if (!session) {
    location.hash = '#/family-hub';
    return section;
  }

  const questions = session.questions || [];
  if (!questions.length) {
    section.className = 'card';
    section.innerHTML = `
      <h1 class="h1">Quiz Unavailable</h1>
      <p class="subtitle">This quiz has no questions configured.</p>
      <a class="button-secondary" href="#/family-hub">Back to Family Hub</a>
    `;
    return section;
  }
  let currentIndex = Number(session.currentIndex || 0);
  const config = session.config || {};
  const total = questions.length;
  let revealHint = false;
  let feedback = '';
  let explain = '';

  if (!session.startedAt) {
    const startedAt = new Date().toISOString();
    session.startedAt = startedAt;
    updateQuizSession(session.id, { startedAt });
  }

  section.innerHTML = `
    <div class="quiz-header">
      <div>
        <h1 class="h1">${session.subject || 'Quiz Session'}</h1>
        <p class="subtitle">${session.topics?.join(', ') || 'General topics'}</p>
      </div>
      <div class="quiz-meta">
        <div class="clock" data-role="clock"></div>
        <div class="timer" data-role="timer"></div>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" data-role="progress"></div>
    </div>
    <div class="quiz-body" data-role="body"></div>
    <div class="quiz-controls">
      <button type="button" class="button-secondary" data-role="prev">Previous</button>
      <button type="button" class="button-secondary" data-role="move-end">Move to End</button>
      <button type="button" class="button" data-role="next">Next</button>
    </div>
  `;

  const body = section.querySelector('[data-role="body"]');
  const progress = section.querySelector('[data-role="progress"]');
  const timerEl = section.querySelector('[data-role="timer"]');
  const clockEl = section.querySelector('[data-role="clock"]');

  const renderClock = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  let submitted = false;

  const renderTimer = () => {
    const minutes = Number(config.timerMinutes || 0);
    if (!minutes) {
      timerEl.textContent = 'Timer: Off';
      return;
    }
    const startedAt = new Date(session.startedAt || new Date().toISOString()).getTime();
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = Math.max(0, minutes * 60 - elapsed);
    const min = Math.floor(remaining / 60);
    const sec = String(remaining % 60).padStart(2, '0');
    timerEl.textContent = `Time Left: ${min}:${sec}`;
    if (remaining === 0 && !submitted) {
      toast.info('Time is up. Submitting quiz...');
      finishQuiz();
    }
  };

  let intervalId = setInterval(() => {
    renderClock();
    renderTimer();
  }, 1000);
  renderClock();
  renderTimer();

  const onHash = () => {
    if (!location.hash.startsWith('#/quiz-session')) {
      clearInterval(intervalId);
      window.removeEventListener('hashchange', onHash);
    }
  };
  window.addEventListener('hashchange', onHash);

  const renderQuestion = () => {
    const question = questions[currentIndex];
    if (!question) return;
    revealHint = false;
    feedback = '';
    explain = '';
    const saved = (session.answers || [])[currentIndex]?.value || '';
    const progressPct = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;
    progress.style.width = `${progressPct}%`;

    const hintButton = config.includeHints && question.hint
      ? `<button type="button" class="button-secondary" data-role="hint">Hint</button>`
      : '';

    body.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-question-head">
          <div class="quiz-index">Question ${currentIndex + 1} / ${total}</div>
          <div class="quiz-type">${question.type.replace('-', ' ')}</div>
        </div>
        ${question.image ? `<img class="quiz-image" src="${question.image}" alt="Question illustration" />` : ''}
        <h2 class="h2">${question.prompt}</h2>
        <form class="quiz-form">
          ${renderInput(question, saved)}
          <div class="actions-row">
            <button type="submit" class="button">Check Answer</button>
            ${hintButton}
            <button type="button" class="button-secondary" data-role="submit-quiz">Submit Quiz</button>
          </div>
        </form>
        <div class="quiz-feedback ${feedback ? 'is-open' : ''}" data-role="feedback"></div>
      </div>
    `;

    const form = body.querySelector('.quiz-form');
    const feedbackBox = body.querySelector('[data-role="feedback"]');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const answer = getAnswer(question, form);
      recordAnswer(session.id, currentIndex, answer);
      session.answers = session.answers || [];
      const correct = question.type !== 'open-ended'
        ? String(answer).trim().toLowerCase() === String(question.answer || '').trim().toLowerCase()
        : true;
      session.answers[currentIndex] = { value: answer, correct };
      feedback = question.type === 'open-ended'
        ? 'Answer saved.'
        : correct ? 'Correct! Great job.' : 'Not quite. Keep going.';
      explain = (!correct && config.includeExplanations && question.type !== 'open-ended')
        ? question.explanation || 'Review the topic and try again.'
        : '';
      feedbackBox.innerHTML = `
        <div>${feedback}</div>
        ${explain ? `<div class="help">${explain}</div>` : ''}
      `;
      feedbackBox.classList.add('is-open');
    });

    const hintBtn = body.querySelector('[data-role="hint"]');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        if (revealHint) return;
        revealHint = true;
        feedbackBox.innerHTML = `<div class="help">Hint: ${question.hint}</div>`;
        feedbackBox.classList.add('is-open');
      });
    }

    body.querySelector('[data-role="submit-quiz"]').addEventListener('click', finishQuiz);
  };

  const finishQuiz = async () => {
    if (submitted) return;
    submitted = true;
    clearInterval(intervalId);
    await completeQuizSession(session.id);
    location.hash = `#/quiz-report?id=${session.id}`;
  };

  const renderInput = (question, saved) => {
    if (question.type === 'multiple-choice') {
      const options = question.options || [];
      return `
        <div class="choice-list">
          ${options.map(opt => `
            <label class="choice-item">
              <input type="radio" name="answer" value="${opt}" ${opt === saved ? 'checked' : ''} />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    }
    if (question.type === 'gap-fill') {
      return `<input type="text" name="answer" value="${saved}" placeholder="Type your answer" />`;
    }
    return `<textarea name="answer" rows="4" placeholder="Write your response">${saved}</textarea>`;
  };

  const getAnswer = (question, form) => {
    if (question.type === 'multiple-choice') {
      const selected = form.querySelector('input[name="answer"]:checked');
      return selected ? selected.value : '';
    }
    return form.querySelector('[name="answer"]').value || '';
  };

  section.querySelector('[data-role="prev"]').addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      updateQuizSession(session.id, { currentIndex });
      renderQuestion();
    }
  });

  section.querySelector('[data-role="next"]').addEventListener('click', () => {
    if (currentIndex < total - 1) {
      currentIndex += 1;
      updateQuizSession(session.id, { currentIndex });
      renderQuestion();
    }
  });

  section.querySelector('[data-role="move-end"]').addEventListener('click', () => {
    if (currentIndex >= total - 1) return;
    const move = questions.splice(currentIndex, 1)[0];
    questions.push(move);
    updateQuizSession(session.id, { questions });
    if (currentIndex >= questions.length) currentIndex = questions.length - 1;
    renderQuestion();
  });

  renderQuestion();

  return section;
}
