export function getTrafficLight(score){
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  if (n >= 80) return 'green';
  if (n >= 50) return 'amber';
  return 'red';
}

export function getNeedsFocus(subjects){
  return (subjects || [])
    .filter(s => getTrafficLight(s.score ?? s.latestScore ?? s.latest) === 'red')
    .map(s => s.name || s.subject)
    .filter(Boolean);
}

export function calculateTrend(scores){
  const nums = (scores || []).map(Number).filter(n => Number.isFinite(n));
  if (nums.length < 3) return 'stable';
  const last = nums.slice(-3);
  if (last[0] < last[1] && last[1] < last[2]) return 'improving';
  if (last[0] > last[1] && last[1] > last[2]) return 'declining';
  return 'stable';
}
