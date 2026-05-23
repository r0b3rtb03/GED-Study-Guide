import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const STUDY_GUIDE_CACHE = {};
const STUDY_GUIDE_DIR = path.resolve('server/data/studyGuides');
const MAX_CHARS = 12000;

let NON_CALC_TIPS = null;
const NON_CALC_PATH = path.resolve('server/data/non-calculator-tips.pdf');
export function getNonCalcTips() { return NON_CALC_TIPS; }

async function loadNonCalcTips() {
  if (!fs.existsSync(NON_CALC_PATH)) return;
  try {
    const text = await parsePdf(fs.readFileSync(NON_CALC_PATH));
    NON_CALC_TIPS = text.slice(0, 8000);
    console.log(`[studyGuides] loaded non-calculator tips (${NON_CALC_TIPS.length} chars)`);
  } catch (err) {
    console.error('[studyGuides] failed to load non-calc tips:', err.message);
  }
}

async function parsePdf(buffer) {
  const pdfParse = require('pdf-parse');
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

export async function loadAllStudyGuides() {
  if (!fs.existsSync(STUDY_GUIDE_DIR)) {
    console.warn(`[studyGuides] directory missing: ${STUDY_GUIDE_DIR}`);
    return;
  }

  const files = fs.readdirSync(STUDY_GUIDE_DIR);
  let sharedText = null;

  for (const file of files) {
    if (file.startsWith('.')) continue;
    const ext = path.extname(file).toLowerCase();
    const slug = path.basename(file, ext);
    const full = path.join(STUDY_GUIDE_DIR, file);

    try {
      let text;
      if (ext === '.pdf') {
        text = await parsePdf(fs.readFileSync(full));
      } else if (ext === '.txt' || ext === '.md') {
        text = fs.readFileSync(full, 'utf-8');
      } else if (ext === '.json') {
        text = fs.readFileSync(full, 'utf-8');
      } else {
        continue;
      }

      text = text.slice(0, MAX_CHARS);

      if (slug === 'ged-math' || slug === 'all' || slug === 'index') {
        sharedText = text;
      } else {
        STUDY_GUIDE_CACHE[slug] = text;
      }
      console.log(`[studyGuides] loaded ${file} (${text.length} chars)`);
    } catch (err) {
      console.error(`[studyGuides] failed to load ${file}:`, err.message);
    }
  }

  await loadNonCalcTips();

  // If we have a single shared guide, use it as fallback for every topic slug.
  if (sharedText) {
    const slugs = ['algebra', 'linear-equations', 'fractions', 'geometry', 'stats'];
    for (const s of slugs) {
      if (!STUDY_GUIDE_CACHE[s]) STUDY_GUIDE_CACHE[s] = sharedText;
    }
  }
}

export function getStudyGuide(slug) {
  return STUDY_GUIDE_CACHE[slug] || null;
}

export function hasStudyGuides() {
  return Object.keys(STUDY_GUIDE_CACHE).length > 0;
}
