import fs from 'node:fs';
import readline from 'node:readline';

const APPROVALS_FILE = 'APPROVALS.json';
const ROLES = [
  { key: 'product', label: 'Product' },
  { key: 'design', label: 'Design' },
  { key: 'security', label: 'Security' },
  { key: 'a11y', label: 'Accessibility' },
  { key: 'legal', label: 'Legal' }
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, ans => res(ans.trim())));

function todayUK() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

let store = {};
if (fs.existsSync(APPROVALS_FILE)) {
  try { store = JSON.parse(fs.readFileSync(APPROVALS_FILE, 'utf8')); }
  catch { store = {}; }
}

(async () => {
  console.log('Oakwood Easy Parenting — Approval Gate');
  for (const role of ROLES) {
    const yesno = (await ask(`Approve Welcome screen as ${role.label}? (y/n) `)).toLowerCase();
    if (yesno === 'y') {
      const initials = await ask(`Your initials for ${role.label}: `);
      store[role.key] = { approved: true, by: initials || 'N/A', date: todayUK() };
    } else {
      store[role.key] = { approved: false };
    }
  }
  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(store, null, 2));
  rl.close();
  console.log('Saved to APPROVALS.json');
})();
