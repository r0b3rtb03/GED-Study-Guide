// Loads each subject's official PDF at boot, caches the extracted text,
// and exposes a getter so the AI prompt builder can paste the right
// content into Gemini's prompt.
//
// Conventions for studyGuides/ filenames (any one works):
//   - <subject>.pdf                      e.g. math.pdf, social-studies.pdf
//   - ged-<subject>.pdf                  e.g. ged-math.pdf
//   - ged-math.pdf / ged-social-studies.pdf
//
// We also pick up Tips-for-Non-calculator-math-EN.pdf (or
// server/data/non-calculator-tips.pdf) as a separate reference doc
// for the Math non-calculator section.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { SUBJECT_SLUGS } from '../data/subjects.js';

const require = createRequire(import.meta.url);

const SUBJECT_CACHE = {};        // { math: '...text...', 'social-studies': '...text...' }
const STUDY_GUIDE_DIR = path.resolve('server/data/studyGuides');
const MAX_CHARS = 12000;

let NON_CALC_TIPS = null;
const NON_CALC_PATHS = [
  path.resolve('server/data/non-calculator-tips.pdf'),
  path.resolve('data/Tips-for-Non-calculator-math-EN.pdf')
];
export function getNonCalcTips() { return NON_CALC_TIPS; }

async function parsePdf(buffer) {
  const pdfParse = require('pdf-parse');
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

function fileToSubject(filename) {
  // Strip extension and common prefixes, normalize.
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  const normalized = base.replace(/^ged-/, '').replace(/-guide$|guide$/, '');
  if (SUBJECT_SLUGS.includes(normalized)) return normalized;
  // Aliases for legacy filenames we already had in the repo.
  if (normalized === 'ged-math' || normalized === 'math' || normalized === 'all' || normalized === 'index') return 'math';
  if (normalized === 'social-studies' || normalized === 'social_studies') return 'social-studies';
  return null;
}

async function loadOne(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf')                       return (await parsePdf(fs.readFileSync(filePath))).slice(0, MAX_CHARS);
  if (ext === '.txt' || ext === '.md')      return fs.readFileSync(filePath, 'utf-8').slice(0, MAX_CHARS);
  if (ext === '.json')                      return fs.readFileSync(filePath, 'utf-8').slice(0, MAX_CHARS);
  return null;
}

async function loadNonCalcTips() {
  for (const p of NON_CALC_PATHS) {
    if (!fs.existsSync(p)) continue;
    try {
      const text = await parsePdf(fs.readFileSync(p));
      NON_CALC_TIPS = text.slice(0, 8000);
      console.log(`[studyGuides] loaded non-calculator tips (${NON_CALC_TIPS.length} chars)`);
      return;
    } catch (err) {
      console.error('[studyGuides] failed to load non-calc tips:', err.message);
    }
  }
}

export async function loadAllStudyGuides() {
  if (!fs.existsSync(STUDY_GUIDE_DIR)) {
    console.warn(`[studyGuides] directory missing: ${STUDY_GUIDE_DIR}`);
    return;
  }

  const files = fs.readdirSync(STUDY_GUIDE_DIR);
  for (const file of files) {
    if (file.startsWith('.')) continue;
    if (/non[-_]?calc/i.test(file)) continue; // handled separately below

    const subject = fileToSubject(file);
    if (!subject) {
      console.warn(`[studyGuides] skipping unrecognized file: ${file}`);
      continue;
    }
    try {
      const text = await loadOne(path.join(STUDY_GUIDE_DIR, file));
      if (text) {
        SUBJECT_CACHE[subject] = text;
        console.log(`[studyGuides] loaded ${file} → subject "${subject}" (${text.length} chars)`);
      }
    } catch (err) {
      console.error(`[studyGuides] failed to load ${file}:`, err.message);
    }
  }

  await loadNonCalcTips();
}

// Subject-aware getter. Falls back to whatever's in the cache for
// backward compatibility when callers only pass a topic slug.
export function getStudyGuide(subjectOrSlug, _slug) {
  // New signature: getStudyGuide('math')
  if (SUBJECT_SLUGS.includes(subjectOrSlug)) return SUBJECT_CACHE[subjectOrSlug] || null;
  // Legacy signature: getStudyGuide('algebra') — assume math
  return SUBJECT_CACHE['math'] || null;
}

export function hasStudyGuides() {
  return Object.keys(SUBJECT_CACHE).length > 0;
}
