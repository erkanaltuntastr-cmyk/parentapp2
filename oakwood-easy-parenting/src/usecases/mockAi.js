let cache = null;
let index = 0;

async function loadFeedback(){
  if (cache) return cache;
  try {
    const res = await fetch('data/mock-ai.json');
    if (!res.ok) return [];
    cache = await res.json();
    return cache;
  } catch {
    return [];
  }
}

export async function getMockFeedback(){
  const list = await loadFeedback();
  if (!Array.isArray(list) || !list.length) return { feedback: 'No feedback available.', suggestions: [] };
  const item = list[index % list.length];
  index += 1;
  return item;
}
