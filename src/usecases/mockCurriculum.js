let cache = null;

async function loadMockCurriculum(){
  if (cache) return cache;
  try {
    const res = await fetch('data/mock-curriculum.json');
    if (!res.ok) return { subjects: [] };
    cache = await res.json();
    return cache;
  } catch {
    return { subjects: [] };
  }
}

export async function getMockTopics(year, subject){
  const data = await loadMockCurriculum();
  const y = Number(year || 0);
  const s = String(subject || '').trim().toLowerCase();
  if (!y || !s) return [];
  const matches = (data.subjects || []).filter(item => Number(item.year) === y && String(item.name || '').toLowerCase() === s);
  if (!matches.length) return [];
  const topics = matches[0].topics || [];
  return topics.flatMap(topic => {
    const main = topic.name || subject;
    const week = topic.week || '';
    const subtopics = Array.isArray(topic.subtopics) && topic.subtopics.length
      ? topic.subtopics
      : [{ name: 'General', week }];
    return subtopics.map(sub => ({
      mainTopic: main,
      subtopic: sub.name || 'General',
      estimatedWeek: sub.week || week || '',
      subject: matches[0].name
    }));
  });
}
