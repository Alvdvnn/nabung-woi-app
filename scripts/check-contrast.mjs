// Verifies every palette/mode in constants/theme.ts meets WCAG AA for the
// token pairs the UI actually renders as text on a background.
//
//   node scripts/check-contrast.mjs
//
// Exits 1 and lists every failing pair. Run after touching palette colors.

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

function loadTs(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.check.mjs`);
  fs.writeFileSync(tmp, out);
  return { url: pathToFileURL(tmp).href, tmp };
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const theme = loadTs(path.join(root, 'constants', 'theme.ts'));
const contrast = loadTs(path.join(root, 'utils', 'contrast.ts'));

const { PALETTES } = await import(theme.url);
const { contrastRatio, AA_TEXT } = await import(contrast.url);
fs.unlinkSync(theme.tmp);
fs.unlinkSync(contrast.tmp);

const SURFACES = ['bg', 'surface', 'surfaceAlt', 'surfaceSunken'];
const TEXT = ['textPrimary', 'textSecondary', 'textMuted'];
const SEMANTIC = ['primary', 'income', 'expense', 'transfer', 'adjustment', 'warning', 'info'];

const failures = [];
let checked = 0;

for (const [id, palette] of Object.entries(PALETTES)) {
  for (const mode of ['light', 'dark']) {
    const c = palette[mode];
    const check = (fg, bg, min) => {
      const r = contrastRatio(c[fg], c[bg]);
      checked += 1;
      if (r === null || r < min) {
        failures.push(`${id}/${mode}: ${fg} (${c[fg]}) on ${bg} (${c[bg]}) = ${r ? r.toFixed(2) : 'n/a'} < ${min}`);
      }
    };
    for (const t of TEXT) for (const s of SURFACES) check(t, s, AA_TEXT);
    for (const s of SEMANTIC) {
      check(s, 'bg', AA_TEXT);
      check(s, 'surface', AA_TEXT);
    }
    check('onPrimary', 'primary', AA_TEXT);
    // Semantic text on its own tinted chip background (e.g. income on incomeLight).
    for (const s of ['income', 'expense', 'adjustment', 'warning', 'info']) check(s, `${s}Light`, AA_TEXT);
    check('primary', 'primarySoft', AA_TEXT);
    check('transfer', 'transferLight', AA_TEXT);
  }
}

if (failures.length) {
  console.error(`Contrast check failed (${failures.length} of ${checked} pairs):`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(`Contrast OK: ${checked} pairs across ${Object.keys(PALETTES).length} palettes x 2 modes meet AA.`);
