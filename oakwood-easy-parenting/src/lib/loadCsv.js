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

export async function loadCsvSchools(url){
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (!lines.length) return [];
    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const idx = {
      name: headers.indexOf('name'),
      postcode: headers.indexOf('postcode'),
      phase: headers.indexOf('phase'),
      la: headers.indexOf('la'),
      town: headers.indexOf('town')
    };
    return lines.slice(1).map(line => {
      const cols = parseCsvLine(line);
      return {
        name: (cols[idx.name] || '').trim(),
        postcode: (cols[idx.postcode] || '').trim(),
        phase: (cols[idx.phase] || '').trim(),
        la: (cols[idx.la] || '').trim(),
        town: (cols[idx.town] || '').trim()
      };
    }).filter(row => row.name);
  } catch {
    return [];
  }
}
