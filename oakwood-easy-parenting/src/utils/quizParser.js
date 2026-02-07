function cleanLine(value){
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseBlock(block){
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  let question = '';
  let answer = '';
  lines.forEach(line => {
    if (/^q(uestion)?\s*[:\-]/i.test(line)) {
      question = cleanLine(line.replace(/^q(uestion)?\s*[:\-]/i, ''));
    } else if (/^a(nswer)?\s*[:\-]/i.test(line)) {
      answer = cleanLine(line.replace(/^a(nswer)?\s*[:\-]/i, ''));
    } else if (!question) {
      question = cleanLine(line);
    }
  });
  if (!question) return null;
  return {
    type: 'open-ended',
    prompt: question,
    answer: answer || '',
    hint: '',
    explanation: ''
  };
}

export function parseManualQuiz(text){
  const raw = String(text || '').trim();
  if (!raw) return [];
  const blocks = raw.split(/\n\s*\n/);
  const items = blocks.map(parseBlock).filter(Boolean);
  if (items.length) return items;

  const lines = raw.split('\n').map(cleanLine).filter(Boolean);
  return lines.map(line => ({
    type: 'open-ended',
    prompt: line,
    answer: '',
    hint: '',
    explanation: ''
  }));
}
