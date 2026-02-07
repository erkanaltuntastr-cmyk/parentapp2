import { getState, saveState } from '../state/appState.js';
import { clearHomework, generateHomework } from './homework.js';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="100%" height="100%" fill="%23F1F5F9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748B" font-family="Arial" font-size="20">Diagram Placeholder</text></svg>';

const QUESTION_BANK = {
  Mathematics: [
    {
      type: 'multiple-choice',
      topic: 'Fractions',
      prompt: 'Which fraction is equivalent to 1/2?',
      options: ['2/4', '2/5', '3/5', '4/5'],
      answer: '2/4',
      hint: 'Multiply the numerator and denominator by the same number.',
      explanation: '1/2 = 2/4 because both numerator and denominator are multiplied by 2.',
      difficulty: 'Easy'
    },
    {
      type: 'gap-fill',
      topic: 'Decimals',
      prompt: 'Fill the blank: 0.7 = ___/10',
      answer: '7',
      hint: 'Think of tenths.',
      explanation: '0.7 is seven tenths.',
      difficulty: 'Easy'
    },
    {
      type: 'open-ended',
      topic: 'Fractions',
      prompt: 'Explain how you would add 1/4 and 2/4.',
      answer: 'Add the numerators and keep the denominator the same.',
      hint: 'The denominators are the same.',
      explanation: 'With like denominators, add numerators: 1 + 2 = 3, so 3/4.',
      difficulty: 'Medium'
    }
  ],
  English: [
    {
      type: 'multiple-choice',
      topic: 'Grammar',
      prompt: 'Which word is a modal verb?',
      options: ['run', 'might', 'cat', 'swiftly'],
      answer: 'might',
      hint: 'Modal verbs show possibility.',
      explanation: 'Might is a modal verb.',
      difficulty: 'Easy'
    },
    {
      type: 'gap-fill',
      topic: 'Punctuation',
      prompt: 'Add a comma: My friend ___ who lives nearby is visiting.',
      answer: ' , ',
      hint: 'Non-essential information needs commas.',
      explanation: 'Use commas around extra information.',
      difficulty: 'Medium'
    },
    {
      type: 'open-ended',
      topic: 'Reading',
      prompt: 'Write one sentence summarising a story about teamwork.',
      answer: '',
      hint: 'Keep it short and clear.',
      explanation: 'Summaries focus on key points.',
      difficulty: 'Medium'
    }
  ],
  Science: [
    {
      type: 'multiple-choice',
      topic: 'Forces',
      prompt: 'Balanced forces cause an object to:',
      options: ['Speed up', 'Slow down', 'Stay at constant speed', 'Stop immediately'],
      answer: 'Stay at constant speed',
      hint: 'Balanced means no change in motion.',
      explanation: 'Balanced forces mean constant speed or rest.',
      difficulty: 'Easy'
    },
    {
      type: 'gap-fill',
      topic: 'Energy',
      prompt: 'Fill the blank: Energy is ___, not created or destroyed.',
      answer: 'transferred',
      hint: 'Think about changes in form.',
      explanation: 'Energy changes form and is transferred.',
      difficulty: 'Easy'
    },
    {
      type: 'open-ended',
      topic: 'Forces',
      prompt: 'Describe one example of friction you see every day.',
      answer: '',
      hint: 'Think about walking or cycling.',
      explanation: 'Friction happens between surfaces that rub.',
      difficulty: 'Medium'
    }
  ]
};

function getBankForSubject(subject){
  const key = Object.keys(QUESTION_BANK).find(k => k.toLowerCase() === String(subject || '').toLowerCase());
  return QUESTION_BANK[key] || QUESTION_BANK.Mathematics;
}

function buildQuestion(template, index, optionsCount){
  const q = { ...template };
  q.id = `q_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`;
  if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
    q.options = q.options.slice(0, Math.max(2, Math.min(5, optionsCount || q.options.length)));
  }
  if (q.image === true) q.image = PLACEHOLDER_IMAGE;
  if (!q.image && index % 7 === 0) q.image = PLACEHOLDER_IMAGE;
  return q;
}

function calculateScore(questions, answers){
  if (!questions.length) return 0;
  const correct = answers.filter(a => a && a.correct).length;
  return Math.round((correct / questions.length) * 100);
}

function buildReport(score){
  if (score >= 85) {
    return {
      strengths: ['Excellent coverage of core concepts.', 'Strong accuracy across question types.'],
      growth: ['Add a few stretch questions next time.'],
      critical: ['No critical gaps detected.']
    };
  }
  if (score >= 60) {
    return {
      strengths: ['Good understanding of key ideas.', 'Progress is steady.'],
      growth: ['Practice mixed question types for fluency.'],
      critical: ['Focus on any missed topics in homework.']
    };
  }
  return {
    strengths: ['Effort shown in attempting all questions.'],
    growth: ['Revisit core definitions and examples.'],
    critical: ['Immediate review needed for foundational topics.']
  };
}

function normalizeQuestionPlan(config){
  const counts = config.counts || {};
  const total = Number(config.totalQuestions || 0);
  const base = {
    multipleChoice: Number(counts.multipleChoice || 0),
    gapFill: Number(counts.gapFill || 0),
    openEnded: Number(counts.openEnded || 0)
  };
  if (total && !base.multipleChoice && !base.gapFill && !base.openEnded) {
    const mc = Math.max(1, Math.round(total * 0.6));
    const gap = Math.max(0, Math.round(total * 0.25));
    const open = Math.max(0, total - mc - gap);
    return { multipleChoice: mc, gapFill: gap, openEnded: open };
  }
  return base;
}

export function createQuizDraft(data){
  const state = getState();
  const draft = {
    id: `d_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...data
  };
  const next = { ...state, quizDrafts: [...(state.quizDrafts || []), draft] };
  saveState(next);
  return draft;
}

export function updateQuizDraft(id, updates){
  const state = getState();
  const quizDrafts = (state.quizDrafts || []).map(d => d.id === id ? { ...d, ...updates } : d);
  saveState({ ...state, quizDrafts });
}

export function createQuizSession(data){
  const state = getState();
  const session = {
    id: `s_${Date.now()}`,
    status: 'pending',
    assignedAt: new Date().toISOString(),
    answers: [],
    ...data
  };
  const next = { ...state, quizSessions: [...(state.quizSessions || []), session] };
  saveState(next);
  return session;
}

export function getQuizSession(id){
  const state = getState();
  return (state.quizSessions || []).find(s => s.id === id) || null;
}

export function listQuizSessions(childId, status){
  const state = getState();
  const list = Array.isArray(state.quizSessions) ? state.quizSessions : [];
  return list.filter(s => {
    if (childId && s.childId !== childId) return false;
    if (status && s.status !== status) return false;
    return true;
  });
}

export function updateQuizSession(id, updates){
  const state = getState();
  const quizSessions = (state.quizSessions || []).map(s => s.id === id ? { ...s, ...updates } : s);
  saveState({ ...state, quizSessions });
}

export function generateMockQuestions({ subject, topics, config }){
  const bank = getBankForSubject(subject);
  const plan = normalizeQuestionPlan(config || {});
  const optionsCount = Number(config.optionsCount || 4);
  const questions = [];
  const pushFromBank = (type, count) => {
    const filtered = bank.filter(q => q.type === type);
    for (let i = 0; i < count; i++) {
      const template = filtered[i % filtered.length] || bank[i % bank.length];
      const item = buildQuestion(template, questions.length + 1, optionsCount);
      if (topics && topics.length) item.topic = topics[i % topics.length];
      questions.push(item);
    }
  };
  pushFromBank('multiple-choice', plan.multipleChoice);
  pushFromBank('gap-fill', plan.gapFill);
  pushFromBank('open-ended', plan.openEnded);
  return questions;
}

export function createSessionFromDraft(draft){
  const questions = generateMockQuestions({
    subject: draft.subject,
    topics: draft.topics,
    config: draft.config || {}
  });
  return createQuizSession({
    childId: draft.childId,
    subject: draft.subject,
    topics: draft.topics,
    mode: draft.mode,
    config: draft.config,
    prompt: draft.prompt,
    questions,
    status: 'pending'
  });
}

export function createRetakeSession(session){
  if (!session) return null;
  const questions = generateMockQuestions({
    subject: session.subject,
    topics: session.topics,
    config: session.config || {}
  });
  return createQuizSession({
    childId: session.childId,
    subject: session.subject,
    topics: session.topics,
    mode: session.mode,
    config: session.config,
    prompt: session.prompt,
    questions,
    status: 'pending',
    isRetake: true
  });
}

export function recordAnswer(sessionId, index, value){
  const session = getQuizSession(sessionId);
  if (!session) return;
  const questions = session.questions || [];
  const question = questions[index];
  if (!question) return;
  const answer = String(value || '').trim();
  let correct = false;
  if (question.type !== 'open-ended') {
    correct = answer.toLowerCase() === String(question.answer || '').trim().toLowerCase();
  }
  const answers = [...(session.answers || [])];
  answers[index] = { value: answer, correct };
  updateQuizSession(sessionId, { answers, updatedAt: new Date().toISOString() });
}

export async function completeQuizSession(sessionId){
  const session = getQuizSession(sessionId);
  if (!session) return null;
  const questions = session.questions || [];
  const answers = session.answers || [];
  const score = calculateScore(questions, answers);
  const report = buildReport(score);

  clearHomework(session.childId, session.subject);
  await generateHomework(session.childId, session.subject);

  updateQuizSession(sessionId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    score,
    report
  });
  return { score, report };
}
