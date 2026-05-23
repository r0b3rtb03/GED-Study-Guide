// Normalize math operators in AI responses to a single canonical style:
//   × for multiplication, ÷ for division, − for subtraction, + for addition.
//
// AI models (Gemini and Claude) sometimes emit LaTeX (\times, \div, \cdot),
// HTML entities (&times;, &divide;), programming operators (*, /), or
// fancy minus variants. This sanitizer collapses all of them so the UI
// always renders the same symbols.
//
// IMPORTANT: We intentionally do NOT touch slashes inside fractions like
// "3/4" when the slash is between digits with no spaces — those should
// render as fractions, not divisions. The heuristic is: replace "/" only
// when it's surrounded by whitespace (e.g. "12 / 4" → "12 ÷ 4") OR is
// part of a clearly-arithmetic context.

const REPLACEMENTS = [
  // LaTeX (with backslash)
  [/\\times\b/g,  '×'],
  [/\\cdot\b/g,   '×'],
  [/\\div\b/g,    '÷'],
  [/\\pm\b/g,     '±'],
  [/\\mp\b/g,     '∓'],
  [/\\le\b/g,     '≤'],
  [/\\ge\b/g,     '≥'],
  [/\\ne\b/g,     '≠'],
  [/\\neq\b/g,    '≠'],
  [/\\approx\b/g, '≈'],
  [/\\sqrt\b/g,   '√'],
  [/\\pi\b/g,     'π'],

  // HTML entities
  [/&times;/gi,   '×'],
  [/&divide;/gi,  '÷'],
  [/&minus;/gi,   '−'],
  [/&plusmn;/gi,  '±'],
  [/&le;/gi,      '≤'],
  [/&ge;/gi,      '≥'],
  [/&ne;/gi,      '≠'],

  // Programming-style multiplication: number * number → number × number
  [/(\d|\))\s*\*\s*(\d|\(|[a-zA-Z])/g, '$1 × $2'],
  // Catch a/b division ONLY when there's whitespace around the slash
  // (so we don't turn "3/4" fractions into "3 ÷ 4").
  [/(\d|\))\s+\/\s+(\d|\()/g, '$1 ÷ $2'],

  // Asterisks that survived (rare): if a stray * remains between identifiers, swap it
  [/(\w)\s*\*\s*(\w)/g, '$1 × $2']
];

// Collapse multiple spaces but preserve newlines.
function normalizeSpaces(s) {
  return s.replace(/[ \t]+/g, ' ').replace(/ ?([×÷+−])  ?/g, ' $1 ').trim();
}

export function formatMath(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const [re, rep] of REPLACEMENTS) out = out.replace(re, rep);
  return normalizeSpaces(out);
}

// Walks an object/array tree and applies formatMath to every string leaf.
// Use this on the question object the AI returned before rendering.
export function formatMathDeep(value) {
  if (typeof value === 'string') return formatMath(value);
  if (Array.isArray(value)) return value.map(formatMathDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = formatMathDeep(value[k]);
    return out;
  }
  return value;
}
