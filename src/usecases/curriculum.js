let cache = null;

function parseCsvLine(line){
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function normaliseYear(year){
  if (year === null || year === undefined) return '';
  const s = String(year).trim();
  if (!s) return '';
  if (/^Year\\s+\\d+$/i.test(s)) return s.replace(/^year/i, 'Year');
  if (/^\\d+$/.test(s)) return `Year ${s}`;
  return s.startsWith('Year') ? s : `Year ${s}`;
}

export async function loadCurriculum(){
  if (cache) return cache;
  try {
    const res = await fetch('src/data/England_National_Curriculum.csv');
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n').split('\\n').filter(l => l.trim());
    if (!lines.length) return [];
    const rawHeader = lines[0].trim();
    const headerLine = rawHeader.startsWith('"') && rawHeader.endsWith('"')
      ? rawHeader.slice(1, -1)
      : rawHeader;
    const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase());
    const idx = {
      year: headers.indexOf('year'),
      subject: headers.indexOf('subject'),
      main: headers.indexOf('main topic'),
      sub: headers.indexOf('subtopic (statutory focus)'),
      week: headers.indexOf('estimated week')
    };
    const rows = lines.slice(1).map(line => {
      const raw = line.trim();
      const inner = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
      const cols = parseCsvLine(inner);
      return {
        year: normaliseYear((cols[idx.year] || '').trim()),
        subject: (cols[idx.subject] || '').trim(),
        mainTopic: (cols[idx.main] || '').trim(),
        subtopic: (cols[idx.sub] || '').trim(),
        estimatedWeek: (cols[idx.week] || '').trim()
      };
    }).filter(r => r.year && r.subject);
    cache = rows;
    return rows;
  } catch {
    return [];
  }
}

export async function getAvailableSubjects(year){
  const y = normaliseYear(year);
  if (!y) return [];
  const rows = await loadCurriculum();
  const set = new Set();
  rows.forEach(r => {
    if (r.year === y && r.subject) set.add(r.subject);
  });
  return Array.from(set);
}

export async function getTopics(year, subject){
  const y = normaliseYear(year);
  const s = (subject || '').trim();
  if (!y || !s) return [];
  const rows = await loadCurriculum();
  return rows.filter(r => r.year === y && r.subject === s);
}
