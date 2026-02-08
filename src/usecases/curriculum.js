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

function splitCsvRows(text){
  const rows = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (text[i + 1] === '"') {
        cur += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if (ch === '\n' && !inQuotes) {
      if (cur.trim()) rows.push(cur);
      cur = '';
      continue;
    }
    if (ch === '\r') continue;
    cur += ch;
  }
  if (cur.trim()) rows.push(cur);
  return rows;
}

function normaliseYear(year){
  if (year === null || year === undefined) return '';
  const s = String(year).trim();
  if (!s) return '';
  if (/^Year\\s+\\d+$/i.test(s)) return s.replace(/^year/i, 'Year');
  if (/^\\d+$/.test(s)) return `Year ${s}`;
  return s.startsWith('Year') ? s : `Year ${s}`;
}

const CURRICULUM_SOURCES = [
  new URL('../../data/England_National_Curriculum_Full_Detailed.csv', import.meta.url),
  new URL('../data/England_National_Curriculum_Full_Detailed.csv', import.meta.url),
  new URL('../data/England_National_Curriculum.csv', import.meta.url)
];

async function fetchCsvText(url){
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

export async function loadCurriculum(){
  if (Array.isArray(cache) && cache.length) return cache;
  if (Array.isArray(cache) && cache.length === 0) {
    cache = null;
  }
  try {
    for (const source of CURRICULUM_SOURCES) {
      const text = await fetchCsvText(source);
      if (!text) continue;
      const cleaned = text.replace(/^\uFEFF/, '');
      const lines = splitCsvRows(cleaned);
      if (!lines.length) continue;
      const rawHeader = lines[0].trim();
      const headerLine = rawHeader.startsWith('"') && rawHeader.endsWith('"')
        ? rawHeader.slice(1, -1)
        : rawHeader;
      const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase());
      if (headers.length) headers[0] = headers[0].replace(/^\uFEFF/, '');
      const idx = {
        year: headers.indexOf('year'),
        subject: headers.indexOf('subject'),
        main: headers.indexOf('main topic'),
        sub: headers.indexOf('subtopic (statutory focus)'),
        week: headers.indexOf('estimated week')
      };
      const hasHeader = idx.year >= 0 && idx.subject >= 0;
      const yearIdx = idx.year >= 0 ? idx.year : 0;
      const subjectIdx = idx.subject >= 0 ? idx.subject : 1;
      const mainIdx = idx.main >= 0 ? idx.main : 2;
      const subIdx = idx.sub >= 0 ? idx.sub : 3;
      const weekIdx = idx.week >= 0 ? idx.week : 4;
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const rows = dataLines.map(line => {
        const raw = line.trim();
        const inner = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
        const cols = parseCsvLine(inner);
        return {
          year: normaliseYear((cols[yearIdx] || '').trim()),
          subject: (cols[subjectIdx] || '').trim(),
          mainTopic: (cols[mainIdx] || '').trim(),
          subtopic: (cols[subIdx] || '').trim(),
          estimatedWeek: (cols[weekIdx] || '').trim()
        };
      }).filter(r => r.year && r.subject);
      if (rows.length) {
        cache = rows;
        return rows;
      }
    }
    return [];
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
