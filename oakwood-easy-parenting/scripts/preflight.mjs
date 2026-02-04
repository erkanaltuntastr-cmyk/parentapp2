import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mustExist = [
  'index.html',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'src/main.js',
  'src/router.js',
  'src/views/Welcome.js'
];

const bannedWords = [
  // Marketing / landing page öğeleri — Welcome ekranında yasak
  'About', 'Contact', 'Feature', 'Why educators', 'Curriculum breakdown'
];

const requiredCopy = {
  'src/views/Welcome.js': [
    "A clear, structured view of a child's learning — aligned with the UK curriculum.",
    'Start with a child',
    'Sign in to an existing profile'
  ]
};

const requiredRoutes = ['#/welcome', '#/add-child', '#/signin'];
const accessibilityHints = [
  { file: 'index.html', hint: 'id="app"' },
  { file: 'src/router.js', hint: 'app.focus()' }
];

let errors = [];

// 1) Dosya/dizin varlığı
for (const rel of mustExist) {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Missing file: ${rel}`);
}

// 2) Welcome copy ve CTA kontrolleri
for (const [file, needles] of Object.entries(requiredCopy)) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) {
    const txt = fs.readFileSync(p, 'utf8');
    needles.forEach(n => {
      if (!txt.includes(n)) errors.push(`Missing required copy in ${file}: "${n}"`);
    });
    bannedWords.forEach(w => {
      if (txt.includes(w)) errors.push(`Banned term in Welcome (remove for product screen): "${w}"`);
    });
  }
}

// 3) Router’da temel rotalar
{
  const p = path.join(root, 'src/router.js');
  if (fs.existsSync(p)) {
    const txt = fs.readFileSync(p, 'utf8');
    requiredRoutes.forEach(r => {
      if (!txt.includes(r)) errors.push(`Route not found in router.js: ${r}`);
    });
  }
}

// 4) Erişilebilirlik ipuçları
for (const { file, hint } of accessibilityHints) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) {
    const txt = fs.readFileSync(p, 'utf8');
    if (!txt.includes(hint)) errors.push(`A11y hint missing in ${file}: ${hint}`);
  }
}

// 5) TODO/DEBUG kalıntıları
const scanDebug = ['index.html', 'src/router.js', 'src/views/Welcome.js'];
for (const rel of scanDebug) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) {
    const txt = fs.readFileSync(p, 'utf8');
    if (/\bTODO\b|console\.log\(/.test(txt)) {
      errors.push(`Debug/TODO leftovers in ${rel} — please clean.`);
    }
  }
}

if (errors.length) {
  console.error('❌ Pre-flight failed:');
  errors.forEach(e => console.error(' -', e));
  process.exit(1);
} else {
  console.log('✅ Pre-flight passed. Ready for approval.');
}
