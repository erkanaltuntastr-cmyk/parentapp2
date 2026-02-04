import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  const p = spawnSync(cmd, args, { stdio: 'inherit' });
  if (p.status !== 0) process.exit(p.status ?? 1);
}
console.log('— Gate: running pre-flight'); run('node', ['scripts/preflight.mjs']);

console.log('— Gate: reading approvals');
const approvals = JSON.parse(fs.readFileSync('APPROVALS.json', 'utf8'));
const required = ['product', 'design', 'security', 'a11y', 'legal'];
const missing = required.filter(k => !(approvals[k] && approvals[k].approved));

if (missing.length) {
  console.error('❌ Stop point: missing approvals →', missing.join(', '));
  process.exit(1);
}
console.log('✅ Stop point passed. You may proceed to the next screen.');
