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

// Ensure a single space follows a multiple-choice prefix like "A)" or "(A)".
// AI responses occasionally come back as "A)Foo" or "(A)Foo" — that reads
// as one squashed token in the UI.
function spaceAfterOptionPrefix(s) {
  return s.replace(/^(\(?[A-D]\))(?!\s)/, '$1 ');
}

// Split a string on KaTeX math segments — \( ... \), \[ ... \], $$ ... $$ —
// so we can sanitize the prose around them without touching the LaTeX inside.
// Returns an array of { math: boolean, text: string } chunks in order.
const MATH_DELIMS = /(\[m\][\s\S]+?\[\/m\]|\[M\][\s\S]+?\[\/M\]|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\$\$[\s\S]+?\$\$)/g;
function splitMath(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(MATH_DELIMS)) {
    if (m.index > last) out.push({ math: false, text: text.slice(last, m.index) });
    out.push({ math: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ math: false, text: text.slice(last) });
  return out;
}

export function formatMath(text) {
  if (typeof text !== 'string') return text;
  // Only sanitize prose segments — leave LaTeX inside \( \), \[ \], $$ $$ alone
  // so KaTeX still has \frac, \sqrt, \times, etc. to render.
  const parts = splitMath(text);
  // First sanitize each non-math chunk. Keep math chunks verbatim.
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].math) continue;
    let s = parts[i].text;
    for (const [re, rep] of REPLACEMENTS) s = s.replace(re, rep);
    parts[i].text = normalizeSpaces(s);
  }
  // Reinstate spaces around math when adjacent prose ends/starts with a
  // word character. AI responses often emit "formula[m]...[/m]" or
  // "[/m]is the total cost" which renders as "formulaC=..." — the math
  // block has no inherent whitespace.
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].math) continue;
    const prev = parts[i - 1];
    const next = parts[i + 1];
    if (prev && !prev.math && /[A-Za-z0-9\)]$/.test(prev.text)) prev.text += ' ';
    if (next && !next.math && /^[A-Za-z0-9\(]/.test(next.text)) next.text = ' ' + next.text;
  }
  let out = parts.map(p => p.text).join('');
  // Run AFTER reassembly so a "A)" prefix that sits OUTSIDE the math block
  // still gets the trailing space, even when the rest of the option is
  // wrapped in [m]...[/m].
  out = spaceAfterOptionPrefix(out);
  return out;
}

/**
 * Strip multiple-choice options that an AI sometimes appends to the question
 * stem (e.g. "...what is the answer? A) foo  B) bar  C) baz  D) qux").
 * The UI renders the options separately as radio buttons, so leaving them in
 * the stem creates a duplicated, cluttered render.
 *
 * Heuristic: find the first occurrence of a standalone "A)" or "(A)"
 * preceded by whitespace, and cut from there. We require the "A)" marker
 * to be FOLLOWED by content that looks option-like (some text plus another
 * option marker further on, OR a sentence-ending punctuation) so we don't
 * accidentally truncate questions that legitimately mention "(A) something"
 * as inline notation.
 */
export function stripEmbeddedOptions(text) {
  if (typeof text !== 'string') return text;
  // Look for "A)" or "(A)" preceded by whitespace, with a "B)" appearing
  // somewhere later — the combination is the giveaway that the AI dumped
  // the options inline.
  const match = text.match(/\s+\(?A\)\s+[\s\S]+?\(?B\)\s/);
  if (!match) return text;
  return text.slice(0, match.index).replace(/\s+$/, '').trim();
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
