// Dual-LLM orchestration:
//   - Gemini Flash for question GENERATION (fast, cheap, high variety)
//   - Claude for answer CHECKING (better reasoning + grading)
// Falls back to Claude for generation if Gemini key isn't configured;
// falls back to canned mock data if neither provider is configured.

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomInt, randomUUID } from 'node:crypto';
import { getTopic, topicPageIndex } from '../data/gedTopicGuides.js';
import { SUBJECTS, isValidSubject } from '../data/subjects.js';
import { getStudyGuide, getNonCalcTips } from './studyGuideLoader.js';

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const GEMINI_MODEL = process.env.GEMINI_MODEL    || 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are an expert GED Mathematical Reasoning tutor. Your role is to:
1. Generate realistic, GED-exam-style math problems appropriate for adult learners.
2. Ensure problems align with the official GED Math content domains.
3. Provide clear, step-by-step explanations that teach understanding, not just answers.
4. Use plain language accessible to adult learners who may have been out of school for years.
5. Always format your JSON responses exactly as specified — no extra text outside the JSON.

MATH OPERATOR FORMATTING — ABSOLUTELY MANDATORY in every string field:
- Multiplication: use × (Unicode U+00D7).  NEVER use *, \\times, \\cdot, or "x".
- Division:       use ÷ (Unicode U+00F7).  NEVER use /, \\div, or "over".
- Subtraction:    use - (plain ASCII hyphen-minus).  NEVER use \\minus or − (en-dash).
- Addition:       use + (plain plus).
- Exponents:      write as "x²" or "x^2", but prefer ²/³ Unicode when the exponent is 2 or 3.
- Square root:    use √. NEVER use \\sqrt.
- Pi:             use π. NEVER use \\pi.
- Do NOT use LaTeX, MathJax, KaTeX, or HTML entities anywhere.
- Fractions like "3/4" or "1/2" may keep the slash (they read as fractions).
- A standalone division in arithmetic (e.g. "12 ÷ 4") MUST use ÷ with spaces around it.`;

// ---------- Provider clients ----------

let claudeClient = null;
function getClaude() {
  if (claudeClient) return claudeClient;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return claudeClient;
}

let geminiClient = null;
function getGemini() {
  if (geminiClient) return geminiClient;
  if (!process.env.GEMINI_API_KEY) return null;
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return geminiClient;
}

export function isAiEnabled() {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
}

export function providers() {
  return {
    generator: getGemini() ? 'gemini' : (getClaude() ? 'claude' : 'mock'),
    checker:   getClaude() ? 'claude' : (getGemini() ? 'gemini' : 'mock')
  };
}

// ---------- JSON extraction ----------

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end   = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in response');
  return JSON.parse(body.slice(start, end + 1));
}

// ---------- Shuffle ----------
// Server-side option shuffler so the LLM's positional bias (it leans "B"/"C") doesn't
// leak into the UI. We re-label every option as A)/B)/C)/D) and remap correctAnswer.
export function shuffleOptions(question) {
  if (question?.type !== 'multiple_choice' || !Array.isArray(question.options) || !question.options.length) {
    return question;
  }
  const stripLetter = s => String(s).replace(/^[A-Z]\)\s*/i, '');
  const items = question.options.map((opt, i) => {
    const originalLetter = (opt.match(/^([A-D])\)/i) || [null, String.fromCharCode(65 + i)])[1].toUpperCase();
    return { originalLetter, text: stripLetter(opt) };
  });

  // Fisher–Yates with crypto-quality randomness
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }

  const correctOriginal = String(question.correctAnswer || '').trim().toUpperCase();
  let newCorrect = correctOriginal;
  items.forEach((it, i) => {
    const newLetter = String.fromCharCode(65 + i);
    if (it.originalLetter === correctOriginal) newCorrect = newLetter;
  });

  return {
    ...question,
    options: items.map((it, i) => `${String.fromCharCode(65 + i)}) ${it.text}`),
    correctAnswer: newCorrect
  };
}

// ---------- Randomness primers ----------
// Inject a fresh seed and a random "flavor" into every prompt so the LLM doesn't keep
// generating the same canonical exercise even with the same study guide context.
const REAL_WORLD_FLAVORS = [
  'a recipe scaling problem in a kitchen',
  'a budget/savings scenario',
  'a construction or carpentry measurement',
  'a road trip distance/time scenario',
  'a grocery store discount/coupon situation',
  'a gardening or landscaping area problem',
  'an electricity bill or utility usage scenario',
  'a sports statistics (basketball, soccer, baseball) angle',
  'a school enrollment / classroom size scenario',
  'a small-business revenue or inventory situation',
  'a fitness training plan (steps, calories, miles)',
  'a temperature change scenario',
  'a clothing sizing / fabric scenario',
  'a phone plan / data usage scenario',
  'a wage / hours / paycheck scenario'
];

function randomPrimer() {
  return {
    seed: randomUUID(),                                         // forces a new path through the model
    flavor: REAL_WORLD_FLAVORS[randomInt(0, REAL_WORLD_FLAVORS.length)],
    numberHint: ['use uncommon two-digit numbers', 'avoid common GED examples', 'use a less-typical setup'][randomInt(0, 3)]
  };
}

// ---------- Mock fallback (no API keys) ----------

const MOCK_QUESTIONS = {
  'algebra': {
    question: 'Solve for x:  2x + 5 = 17',
    type: 'multiple_choice',
    options: ['A) x = 4', 'B) x = 6', 'C) x = 8', 'D) x = 11'],
    correctAnswer: 'B',
    calculatorAllowed: false,
    calculatorReasoning: 'Simple one-variable equation with clean integers — calculator-prohibited section.',
    studyGuideReference: 'Solving one-variable linear equations',
    hint: 'Subtract 5 from both sides, then divide by 2.',
    explanation: 'Tests solving a two-step linear equation.',
    steps: ['Step 1: Subtract 5 from both sides: 2x = 12', 'Step 2: Divide by 2: x = 6', 'Step 3: Check: 2(6)+5 = 17 ✓']
  },
  'linear-equations': {
    question: 'A line passes through (1, 2) and (4, 11). What is its slope?',
    type: 'multiple_choice',
    options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
    correctAnswer: 'C',
    calculatorAllowed: true,
    calculatorReasoning: 'Slope from coordinates — calculator-allowed section.',
    studyGuideReference: 'Slope formula: m = (y2 - y1) / (x2 - x1)',
    hint: 'Use the slope formula.',
    explanation: 'Tests the slope formula between two points.',
    steps: ['Step 1: m = (11 - 2) / (4 - 1)', 'Step 2: m = 9 / 3', 'Step 3: m = 3']
  },
  'fractions': {
    question: 'A jacket originally costs $80 and is on sale for 25% off. What is the sale price?',
    type: 'multiple_choice',
    options: ['A) $55', 'B) $60', 'C) $65', 'D) $70'],
    correctAnswer: 'B',
    calculatorAllowed: true,
    calculatorReasoning: 'Real-world percent/discount — calculator-allowed section.',
    studyGuideReference: 'Percent of a number; discount problems',
    hint: 'Find 25% of $80, then subtract.',
    explanation: 'Tests percent-of-a-number applied to a discount.',
    steps: ['Step 1: 0.25 × 80 = 20', 'Step 2: 80 − 20 = 60', 'Step 3: Sale price is $60']
  },
  'geometry': {
    question: 'A right triangle has legs of 6 and 8. What is the length of the hypotenuse?',
    type: 'multiple_choice',
    options: ['A) 10', 'B) 12', 'C) 14', 'D) 48'],
    correctAnswer: 'A',
    calculatorAllowed: false,
    calculatorReasoning: 'Pythagorean theorem with perfect-square result — calculator-prohibited section.',
    studyGuideReference: 'Pythagorean theorem: a² + b² = c²',
    hint: 'Use a² + b² = c².',
    explanation: 'Tests the Pythagorean theorem.',
    steps: ['Step 1: 6² + 8² = c²', 'Step 2: 36 + 64 = 100', 'Step 3: c = √100 = 10']
  },
  'stats': {
    question: 'Find the mean of the numbers: 4, 8, 6, 10, 2',
    type: 'numeric',
    correctAnswer: '6',
    calculatorAllowed: true,
    calculatorReasoning: 'Statistics on a dataset — calculator-allowed section.',
    studyGuideReference: 'Mean (arithmetic average)',
    hint: 'Add them up and divide by the count.',
    explanation: 'Tests the arithmetic mean.',
    steps: ['Step 1: Sum = 30', 'Step 2: Count = 5', 'Step 3: Mean = 6']
  }
};

// Subject → topic → mock. SS mocks added so a no-key dev environment
// still demos the multi-subject UI.
const SS_MOCK_QUESTIONS = {
  'civics-government': {
    question: 'The U.S. Constitution divides power among three branches of government. Which branch is responsible for interpreting laws?',
    type: 'multiple_choice',
    options: ['A) Executive', 'B) Legislative', 'C) Judicial', 'D) Federal Reserve'],
    correctAnswer: 'C',
    studyGuideReference: 'Main ideas and details in social studies readings — Page 4',
    studyGuidePage: 4,
    hint: 'Think about which branch contains the Supreme Court.',
    explanation: 'Tests understanding of separation of powers.',
    steps: ['Step 1: Recall the three branches: executive, legislative, judicial.', 'Step 2: Match each to a function — executive enforces, legislative makes laws, judicial interprets.', 'Step 3: The judicial branch interprets laws — answer is C.']
  },
  'us-history': {
    question: 'Reconstruction (1865–1877) attempted to reintegrate Southern states after the Civil War. Which constitutional amendment ratified during this era granted citizenship to all persons born in the United States?',
    type: 'multiple_choice',
    options: ['A) 13th Amendment', 'B) 14th Amendment', 'C) 15th Amendment', 'D) 16th Amendment'],
    correctAnswer: 'B',
    studyGuideReference: 'Connections between historical events — Page 14',
    studyGuidePage: 14,
    hint: 'The amendment is famous for its citizenship clause and equal-protection clause.',
    explanation: 'Tests knowledge of Reconstruction-era amendments.',
    steps: ['Step 1: List the Reconstruction amendments: 13 (abolished slavery), 14 (citizenship + equal protection), 15 (voting rights regardless of race).', 'Step 2: Match the citizenship clause to the 14th.', 'Step 3: Answer is B.']
  }
};

function mockQuestion(subject, topic) {
  if (subject === 'social-studies') {
    return { ...(SS_MOCK_QUESTIONS[topic] || SS_MOCK_QUESTIONS['civics-government']) };
  }
  return { ...(MOCK_QUESTIONS[topic] || MOCK_QUESTIONS['algebra']) };
}

function mockCheck({ correctAnswer, userAnswer }) {
  const norm = v => String(v ?? '').trim().toUpperCase();
  const isCorrect = norm(userAnswer) === norm(correctAnswer);
  return {
    isCorrect,
    explanation: isCorrect
      ? 'You got it. Working through the steps carefully is exactly the right approach for the GED.'
      : `Not quite. The correct answer was ${correctAnswer}. Walk through the steps below.`,
    steps: ['Re-read the question.', 'Apply the relevant formula.', 'Plug in values and simplify carefully.'],
    encouragement: isCorrect ? 'Nice work — keep that momentum going!' : 'Every miss is a learning opportunity.'
  };
}

// ---------- Prompt builders ----------

function buildGenerationPrompt({ subject, topic, difficulty, previousQuestions, primer }) {
  const subjectMeta = SUBJECTS[subject];
  const topicGuide = getTopic(subject, topic);
  const studyContent = getStudyGuide(subject);

  const studyGuideBlock = studyContent
    ? `Official ${subjectMeta.fullName} study guide — base the question on concepts in this material:

--- STUDY GUIDE START ---
${studyContent}
--- STUDY GUIDE END ---`
    : `Topic scope reference: ${topicGuide.scope}`;

  const pageIndex = `
Concept-to-page index for "${topicGuide.sectionName}" section of the official ${subjectMeta.fullName} PDF (pages ${topicGuide.pageRange[0]}–${topicGuide.pageRange[1]}):
${topicPageIndex(subject, topic)}`;

  // Math-only: the calculator-prohibited tips. Other subjects skip this block
  // and the calculatorAllowed/calculatorReasoning fields entirely.
  const isMath = subject === 'math';
  const nonCalcTips = getNonCalcTips();
  const nonCalcBlock = (isMath && nonCalcTips)
    ? `Official GED "Tips for the Calculator-Prohibited Section":

--- NON-CALCULATOR TIPS START ---
${nonCalcTips}
--- NON-CALCULATOR TIPS END ---

Use these rules:
- Calculator-prohibited section: basic arithmetic, exponents/roots, order of operations, scientific notation, absolute value/number-line distance, ordering rationals, identifying undefined expressions.
- Calculator-allowed: multi-step word problems with messy numbers, percent change, geometry with π or non-perfect-square roots, slope/intercepts from raw data, statistics computations.`
    : '';

  const mathOpsBlock = isMath ? '' : `\nNOTE: This is a ${subjectMeta.name} question, not a math question. Do NOT force math operator formatting; use plain prose.`;

  // Subject-specific variety guidance.
  const varietyBlock = isMath
    ? `VARIETY REQUIREMENTS (CRITICAL):
- Random seed for this generation: ${primer.seed}. Use this to make a problem you have NEVER produced before.
- Real-world context to incorporate: ${primer.flavor}.
- Style: ${primer.numberHint}.
- Do NOT default to canonical textbook examples (no "2x + 5 = 17", no "(1,2) and (4,11) slope", no "6-8-10 triangle", no "25% off $80 jacket").
- The numbers used should NOT be common GED-prep clichés (e.g., 6,8,10; 3,4,5; multiples of 25%).`
    : `VARIETY REQUIREMENTS (CRITICAL):
- Random seed for this generation: ${primer.seed}. Generate a question you have NEVER produced before.
- Vary the specific people, events, documents, places, dates, and data sources across questions.
- Avoid the most over-used GED-prep examples (don't always use the Bill of Rights, the Civil War, or the same handful of charts). Cycle through different content within the topic scope.
- For reading-comprehension questions, write a SHORT (2-4 sentence) passage in the question itself, then ask about it. Do not assume the student has access to outside material.`;

  // Fields and rules — slightly different shape for math vs. non-math.
  const mathOnlyFields = isMath
    ? 'calculatorAllowed (boolean), calculatorReasoning (string), '
    : '';

  return `Generate a single GED ${subjectMeta.name} practice question for the topic: "${topicGuide.name}".
Difficulty: ${difficulty} (easy = single step, medium = 2-3 steps, hard = requires interpretation/synthesis).

${varietyBlock}${mathOpsBlock}

CRITICAL: Your JSON response MUST include ALL of these fields:
  question, type, options (if multiple_choice), correctAnswer,
  ${mathOnlyFields}studyGuideReference, studyGuidePage (integer), hint, explanation, steps.

${studyGuideBlock}

${pageIndex}

${nonCalcBlock}

Rules:
- The question MUST test a concept covered in the study guide / scope above.
- For multiple_choice, provide EXACTLY 4 options labeled "A) ...", "B) ...", "C) ...", "D) ...".
- correctAnswer MUST be one of "A", "B", "C", or "D" for multiple choice (the server shuffles positions later).
- studyGuidePage MUST be the EXACT page number from the concept-to-page index for the specific concept this question tests. Pick the single most relevant page.
- studyGuideReference MUST follow the format: "<Concept name from the index> — Page <N>" where N is the same page as studyGuidePage.
${previousQuestions.length > 0 ? `- AVOID any of these previously-asked questions:\n${previousQuestions.slice(-15).join('\n')}` : ''}

Return ONLY valid JSON (no markdown):
{
  "question": "...",
  "type": "multiple_choice" | "numeric" | "fill_in",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A" | "B" | "C" | "D" | "<value>",
  ${isMath ? `"calculatorAllowed": true,
  "calculatorReasoning": "One sentence on whether this is calculator-prohibited.",
  ` : ''}"studyGuideReference": "<Concept name> — Page <N>",
  "studyGuidePage": <N>,
  "hint": "Short hint without giving away the answer.",
  "explanation": "What concept this tests.",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}`;
}

function buildCheckPrompt({ question, correctAnswer, userAnswer, subject, topic }) {
  const subjectMeta = SUBJECTS[subject] || { name: 'Math' };
  return `A GED student answered a ${subjectMeta.name} question. Evaluate their answer and provide feedback.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Subject: ${subjectMeta.name}
Topic: ${topic}

Return ONLY valid JSON:
{
  "isCorrect": true | false,
  "explanation": "Why the correct answer is correct (2-3 sentences, encouraging tone).",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "encouragement": "A short 1-sentence motivational message."
}`;
}

// ---------- Provider callers ----------

async function callClaude({ prompt, maxTokens = 1500 }) {
  const c = getClaude();
  if (!c) throw new Error('ANTHROPIC_API_KEY not configured');
  let msg;
  try {
    msg = await c.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });
  } catch (err) {
    const detail = err?.error?.error?.message || err?.message || String(err);
    console.error(`[claude] API error (model=${CLAUDE_MODEL}): ${detail}`);
    throw new Error(`Claude API error: ${detail}`);
  }
  const text = msg.content.map(b => b.type === 'text' ? b.text : '').join('');
  try {
    return extractJson(text);
  } catch (err) {
    console.error('[claude] JSON parse failed. Raw response:\n', text);
    throw new Error('Claude returned malformed JSON.');
  }
}

async function callGemini({ prompt, maxTokens = 2048 }) {
  const c = getGemini();
  if (!c) throw new Error('GEMINI_API_KEY not configured');
  let text = '';
  try {
    const model = c.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 1.1,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
        // Disable "thinking" on Gemini 2.5 Flash — cuts latency by ~3x.
        // The thinking step is unnecessary for short structured JSON outputs.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    const detail = err?.message || String(err);
    console.error(`[gemini] API error (model=${GEMINI_MODEL}): ${detail}`);
    throw new Error(`Gemini API error: ${detail}`);
  }
  try {
    return extractJson(text);
  } catch (err) {
    console.error('[gemini] JSON parse failed. Raw response (first 500 chars):\n', String(text).slice(0, 500));
    throw new Error('Gemini returned malformed JSON.');
  }
}

// ---------- Public API ----------

export async function generateQuestion({ subject = 'math', topic, difficulty, previousQuestions = [] }) {
  if (!isValidSubject(subject)) throw new Error(`Unknown subject: ${subject}`);
  if (!getTopic(subject, topic)) throw new Error(`Unknown topic for ${subject}: ${topic}`);

  if (!isAiEnabled()) return shuffleOptions(mockQuestion(subject, topic));

  const primer = randomPrimer();
  const prompt = buildGenerationPrompt({ subject, topic, difficulty, previousQuestions, primer });

  let question;
  if (getGemini())      question = await callGemini({ prompt });
  else if (getClaude()) question = await callClaude({ prompt });
  else                  return shuffleOptions(mockQuestion(subject, topic));

  return shuffleOptions(question);
}

export async function checkAnswer({ question, correctAnswer, userAnswer, subject = 'math', topic }) {
  if (!isAiEnabled()) return mockCheck({ correctAnswer, userAnswer });

  const prompt = buildCheckPrompt({ question, correctAnswer, userAnswer, subject, topic });
  if (getClaude())      return await callClaude({ prompt });
  if (getGemini())      return await callGemini({ prompt });
  return mockCheck({ correctAnswer, userAnswer });
}

export async function structureNotes(rawText) {
  if (!isAiEnabled()) {
    return {
      title: 'Study Notes',
      sections: [{
        heading: 'Overview',
        content: rawText.slice(0, 1200),
        keyFormulas: [],
        tips: ['Add ANTHROPIC_API_KEY or GEMINI_API_KEY to .env to enable AI-structured notes.']
      }]
    };
  }

  const prompt = `Convert this raw GED Math study guide content into clean, student-friendly structured notes.
Return ONLY valid JSON:
{
  "title": "Topic name",
  "sections": [
    { "heading": "Section title", "content": "Explanation...", "keyFormulas": ["..."], "tips": ["..."] }
  ]
}

Raw content:
${rawText.slice(0, 8000)}`;

  if (getClaude()) return await callClaude({ prompt, maxTokens: 2048 });
  return await callGemini({ prompt, maxTokens: 2048 });
}
