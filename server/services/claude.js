import Anthropic from '@anthropic-ai/sdk';
import { GED_TOPIC_GUIDES } from '../data/gedTopicGuides.js';
import { getStudyGuide, getNonCalcTips } from './studyGuideLoader.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

const GED_SYSTEM_PROMPT = `You are an expert GED Mathematical Reasoning tutor. Your role is to:
1. Generate realistic, GED-exam-style math problems appropriate for adult learners.
2. Ensure problems align with the official GED Math content domains.
3. Provide clear, step-by-step explanations that teach understanding, not just answers.
4. Use plain language accessible to adult learners who may have been out of school for years.
5. Always format your JSON responses exactly as specified — no extra text outside the JSON.`;

let client = null;
function getClient() {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export function isAiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

function extractJson(text) {
  // Strip code fences if Claude wrapped the JSON
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in response');
  return JSON.parse(body.slice(start, end + 1));
}

async function callClaude({ prompt, maxTokens = 1024 }) {
  const c = getClient();
  if (!c) throw new Error('ANTHROPIC_API_KEY not configured');
  let msg;
  try {
    msg = await c.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: GED_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });
  } catch (err) {
    const detail = err?.error?.error?.message || err?.message || String(err);
    console.error(`[claude] API error (model=${MODEL}): ${detail}`);
    throw new Error(`Claude API error: ${detail}`);
  }
  const text = msg.content.map(b => b.type === 'text' ? b.text : '').join('');
  try {
    return extractJson(text);
  } catch (err) {
    console.error('[claude] JSON parse failed. Raw response:\n', text);
    throw new Error('Claude returned malformed JSON. See server logs.');
  }
}

// ---- Mock fallback when no API key is set ----

const MOCK_QUESTIONS = {
  'algebra': {
    question: 'Solve for x:  2x + 5 = 17',
    type: 'multiple_choice',
    options: ['A) x = 4', 'B) x = 6', 'C) x = 8', 'D) x = 11'],
    correctAnswer: 'B',
    calculatorAllowed: false,
    calculatorReasoning: 'Simple one-variable equation with clean integers — tests basic arithmetic appropriate for the calculator-prohibited section.',
    studyGuideReference: 'Solving one-variable linear equations',
    hint: 'Subtract 5 from both sides, then divide by 2.',
    explanation: 'Tests solving a one-step then two-step linear equation.',
    steps: [
      'Step 1: Subtract 5 from both sides: 2x = 12',
      'Step 2: Divide both sides by 2: x = 6',
      'Step 3: Check: 2(6) + 5 = 17 ✓'
    ]
  },
  'linear-equations': {
    question: 'A line passes through the points (1, 2) and (4, 11). What is its slope?',
    type: 'multiple_choice',
    options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
    correctAnswer: 'C',
    calculatorAllowed: true,
    calculatorReasoning: 'Computing slope from coordinate points typically appears in the calculator-allowed section.',
    studyGuideReference: 'Slope formula: m = (y2 - y1) / (x2 - x1)',
    hint: 'Use the slope formula.',
    explanation: 'Tests the slope formula between two points.',
    steps: [
      'Step 1: m = (y2 - y1) / (x2 - x1)',
      'Step 2: m = (11 - 2) / (4 - 1) = 9 / 3',
      'Step 3: m = 3'
    ]
  },
  'fractions': {
    question: 'A jacket originally costs $80 and is on sale for 25% off. What is the sale price?',
    type: 'multiple_choice',
    options: ['A) $55', 'B) $60', 'C) $65', 'D) $70'],
    correctAnswer: 'B',
    calculatorAllowed: true,
    calculatorReasoning: 'Real-world percent/discount word problem — calculator is allowed for this section of the test.',
    studyGuideReference: 'Percent of a number; discount problems',
    hint: 'First find 25% of $80, then subtract.',
    explanation: 'Tests percent-of-a-number applied to a real-world discount.',
    steps: [
      'Step 1: 25% of 80 = 0.25 × 80 = 20',
      'Step 2: Subtract the discount: 80 − 20 = 60',
      'Step 3: The sale price is $60'
    ]
  },
  'geometry': {
    question: 'A right triangle has legs of 6 and 8. What is the length of the hypotenuse?',
    type: 'multiple_choice',
    options: ['A) 10', 'B) 12', 'C) 14', 'D) 48'],
    correctAnswer: 'A',
    calculatorAllowed: false,
    calculatorReasoning: 'Pythagorean theorem with a clean perfect-square result — straightforward arithmetic suitable for the calculator-prohibited section.',
    studyGuideReference: 'Pythagorean theorem: a² + b² = c²',
    hint: 'Use a² + b² = c².',
    explanation: 'Tests the Pythagorean theorem.',
    steps: [
      'Step 1: 6² + 8² = c²',
      'Step 2: 36 + 64 = 100',
      'Step 3: c = √100 = 10'
    ]
  },
  'stats': {
    question: 'Find the mean of the numbers: 4, 8, 6, 10, 2',
    type: 'numeric',
    correctAnswer: '6',
    calculatorAllowed: true,
    calculatorReasoning: 'Statistics computation on a dataset — calculator is typically allowed.',
    studyGuideReference: 'Mean (arithmetic average)',
    hint: 'Add them up and divide by the count.',
    explanation: 'Tests the arithmetic mean.',
    steps: [
      'Step 1: Sum = 4 + 8 + 6 + 10 + 2 = 30',
      'Step 2: There are 5 numbers',
      'Step 3: Mean = 30 / 5 = 6'
    ]
  }
};

function mockQuestion(topic) {
  return MOCK_QUESTIONS[topic] || MOCK_QUESTIONS['algebra'];
}

function mockCheck({ correctAnswer, userAnswer }) {
  const normalize = v => String(v ?? '').trim().toUpperCase();
  const isCorrect = normalize(userAnswer) === normalize(correctAnswer);
  return {
    isCorrect,
    explanation: isCorrect
      ? 'You got it. Working through the steps carefully is exactly the right approach for the GED.'
      : `Not quite. The correct answer was ${correctAnswer}. Work through the steps below to see why.`,
    steps: ['Re-read the question and identify what is being asked.',
            'Apply the relevant formula or procedure.',
            'Plug in the values and simplify carefully.'],
    encouragement: isCorrect ? 'Nice work — keep that momentum going!' : 'Every miss is a learning opportunity. Try another one.'
  };
}

// ---- Public API ----

export async function generateQuestion({ topic, difficulty, previousQuestions = [] }) {
  if (!isAiEnabled()) return mockQuestion(topic);

  const topicGuide = GED_TOPIC_GUIDES[topic];
  if (!topicGuide) throw new Error(`Unknown topic: ${topic}`);
  const studyContent = getStudyGuide(topic);

  const studyGuideBlock = studyContent
    ? `The following is the official GED Math study guide content for this topic. Base your question DIRECTLY on concepts, terminology, formulas, and examples in this material:

--- STUDY GUIDE START ---
${studyContent}
--- STUDY GUIDE END ---`
    : `Topic scope reference: ${topicGuide.scope}`;

  const nonCalcTips = getNonCalcTips();
  const nonCalcBlock = nonCalcTips
    ? `The official GED "Tips for the Calculator-Prohibited Section" describes which question types appear in the non-calculator portion of the test (~12% of points). Use it to decide whether THIS question would appear in the calculator-prohibited section.

--- NON-CALCULATOR TIPS START ---
${nonCalcTips}
--- NON-CALCULATOR TIPS END ---

Use these rules:
- A question belongs to the calculator-prohibited section when it tests: the four basic operations on small/clean numbers, exponents and roots, order of operations, scientific notation, absolute value/number-line distance, ordering rational numbers, identifying when an expression is undefined, or other basic number sense.
- Calculator IS allowed for: multi-step word problems with messy numbers, percent change, geometry with π or square roots of non-perfect squares, slope/intercepts from raw data points, statistics computations on a dataset, and anything that benefits from a calculator.
- Set "calculatorAllowed": false when the problem is suitable for the calculator-prohibited section; otherwise true.
- Provide a one-sentence "calculatorReasoning" explaining why.`
    : `Set "calculatorAllowed" based on whether the GED calculator-prohibited section would include this kind of question (basic arithmetic, exponents/roots, order of operations, scientific notation, simple number sense → false; everything else → true). Provide a one-sentence "calculatorReasoning".`;

  const prompt = `Generate a single GED Math practice problem for the topic: "${topicGuide.name}".
Difficulty: ${difficulty} (easy = single step, medium = 2-3 steps, hard = multi-step word problem).

CRITICAL: Your JSON response MUST include ALL of these fields, no exceptions:
  question, type, options (if multiple_choice), correctAnswer,
  calculatorAllowed (boolean), calculatorReasoning (string),
  studyGuideReference, hint, explanation, steps.
A response missing "calculatorAllowed" or "calculatorReasoning" is INVALID and will be rejected.

${studyGuideBlock}

${nonCalcBlock}

Rules:
- The problem MUST test a concept explicitly covered in the study guide / scope above.
- Use realistic GED exam phrasing.
- Do NOT invent concepts outside the scope.
- ALWAYS set calculatorAllowed (true or false) AND calculatorReasoning (one sentence).
${previousQuestions.length > 0 ? `- Avoid repeating these questions:\n${previousQuestions.slice(-5).join('\n')}` : ''}

Return ONLY valid JSON (no markdown), in this exact shape:
{
  "question": "...",
  "type": "multiple_choice" | "numeric" | "fill_in",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A" | "B" | "C" | "D" | "<numeric value>",
  "calculatorAllowed": true,
  "calculatorReasoning": "One sentence explaining why this is or isn't a calculator-prohibited question.",
  "studyGuideReference": "Short quote or section title from the guide this question is based on.",
  "hint": "A short hint without giving away the answer.",
  "explanation": "Brief explanation of what concept this tests.",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}`;

  return await callClaude({ prompt, maxTokens: 1500 });
}

export async function checkAnswer({ question, correctAnswer, userAnswer, topic }) {
  if (!isAiEnabled()) return mockCheck({ correctAnswer, userAnswer });

  const prompt = `A GED student answered a math question. Evaluate their answer and provide feedback.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Topic: ${topic}

Return ONLY valid JSON:
{
  "isCorrect": true | false,
  "explanation": "Why the correct answer is correct (2-3 sentences, encouraging tone).",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "encouragement": "A short 1-sentence motivational message."
}`;

  return await callClaude({ prompt, maxTokens: 1024 });
}

export async function structureNotes(rawText) {
  if (!isAiEnabled()) {
    return {
      title: 'Study Notes',
      sections: [{
        heading: 'Overview',
        content: rawText.slice(0, 1200),
        keyFormulas: [],
        tips: ['Add ANTHROPIC_API_KEY to .env to enable AI-structured notes.']
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

  return await callClaude({ prompt, maxTokens: 2048 });
}
