// GED Study Guide — guided product tour.
// Lazily loads the tour engine (tour.js + tour.css), shows a quick orientation
// of the sidebar, then walks the user through a MOCK practice question card
// so they can see exactly how a session feels — questions, options, hint,
// show-answer, step-by-step solution, and the progress bar — without
// burning a real Gemini call.

let _enginePromise = null;
function loadTourEngine() {
  if (_enginePromise) return _enginePromise;
  _enginePromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[href="/js/tour.css"]')) {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = '/js/tour.css';
      document.head.appendChild(link);
    }
    if (window.SiteTour) return resolve(window.SiteTour);
    const script = document.createElement('script');
    script.src = '/js/tour.js';
    script.onload  = () => resolve(window.SiteTour);
    script.onerror = () => reject(new Error('Failed to load /js/tour.js'));
    document.head.appendChild(script);
  });
  return _enginePromise;
}

// ---------- Demo practice card ----------
// Injected once at tour start, removed at tour end. Position: fixed,
// centered, with its own overlay z-index so the tour cutout still draws
// over it correctly.

const DEMO_QUESTION = {
  subject: 'social-studies',
  topic: 'U.S. History',
  difficulty: 'Easy',
  questionNum: 7,
  totalQuestions: 10,
  question: "The Boston Tea Party (1773) was a protest by American colonists against a tax on imported tea. Less than two years later, the American Revolutionary War began. Which best describes the relationship between these two events?",
  options: [
    "A) The tea tax was the sole cause of the Revolution.",
    "B) The protest contributed to growing tensions that escalated into war.",
    "C) The two events were unrelated coincidences.",
    "D) The Revolution would have started even without any colonial protests."
  ],
  correctAnswer: 'B',
  hint: "Think about whether earlier events truly cause later ones or simply precede them.",
  studyGuideReference: "Connections between historical events — Page 14",
  steps: [
    "Step 1: Identify the two events — the Boston Tea Party (1773) and the start of the Revolutionary War (1775).",
    "Step 2: Ask whether the earlier event CAUSED the later one or simply happened before it.",
    "Step 3: One protest alone didn't cause a war (rules out A and D), but the events are connected (rules out C).",
    "Step 4: The protest was one of MANY tensions that built up — that's a contributing cause, not a sole cause. Answer is B."
  ]
};

function buildDemoCard() {
  const wrap = document.createElement('div');
  wrap.id = 'ged-tour-demo';
  // Centered, scrollable, fixed. Z-index UNDER the tour overlay (10000)
  // but children get tour-highlighted z-index 10001+ via tour.css automatically
  // when the engine highlights them. We use z-index 5000 here so the demo
  // sits above page content but under the overlay.
  wrap.style.cssText = 'position:fixed;inset:0;z-index:5000;overflow-y:auto;padding:80px 16px 32px;pointer-events:auto;';
  wrap.innerHTML = `
    <div id="demoBackdrop" style="position:absolute;inset:0;background:rgba(247,249,251,0.6);backdrop-filter:blur(2px);"></div>
    <div style="position:relative;max-width:640px;margin:0 auto;">
      <!-- Top sticky bar (mirrors session bar) -->
      <div id="demoBar" style="background:#fff;border:1px solid #c3c6d1;border-radius:12px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <span id="demoTopicBadge" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#cde7e7;color:#003a3a;font-size:12px;font-weight:700;white-space:nowrap;">
          🌍 ${DEMO_QUESTION.topic}
        </span>
        <span style="font-size:12px;font-weight:700;color:#43474f;font-variant-numeric:tabular-nums;">0:42</span>
        <div id="demoDifficulty" style="display:inline-flex;background:#eceef0;padding:3px;border-radius:999px;font-size:12px;font-weight:700;">
          <span style="padding:4px 10px;border-radius:999px;background:#001e40;color:#fff;">Easy</span>
          <span style="padding:4px 10px;color:#43474f;">Medium</span>
          <span style="padding:4px 10px;color:#43474f;">Hard</span>
        </div>
        <span id="demoCounter" style="font-size:12px;font-weight:700;color:#43474f;white-space:nowrap;">Q ${DEMO_QUESTION.questionNum}/${DEMO_QUESTION.totalQuestions}</span>
      </div>

      <!-- Question card -->
      <div id="demoCard" style="background:#fff;border:1px solid #c3c6d1;border-radius:12px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,0.1);">
        <p id="demoQuestion" style="font-size:17px;line-height:1.6;color:#191c1e;margin-bottom:20px;">${DEMO_QUESTION.question}</p>

        <div id="demoOptions" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          ${DEMO_QUESTION.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            return `<label data-letter="${letter}" class="demo-option" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #c3c6d1;border-radius:10px;font-size:15px;color:#191c1e;cursor:pointer;transition:all .15s;">
              <input type="radio" name="demo-opt" style="accent-color:#001e40;"/> ${opt}
            </label>`;
          }).join('')}
        </div>

        <!-- Hint (hidden by default; revealed in a tour step) -->
        <div id="demoHint" style="display:none;padding:12px 14px;background:#fff7ed;border:1px solid #f59e0b;border-radius:10px;font-size:14px;color:#92400e;margin-bottom:16px;">
          <strong>Hint:</strong> ${DEMO_QUESTION.hint}
        </div>

        <!-- Feedback (hidden by default; revealed in a tour step) -->
        <div id="demoFeedback" style="display:none;padding:16px;background:#ecfdf5;border:1px solid #10b981;border-radius:10px;margin-bottom:16px;">
          <p style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#047857;margin-bottom:8px;">✓ Correct!</p>
          <p style="font-size:14px;color:#065f46;margin-bottom:12px;"><strong>The correct answer is B.</strong> The Boston Tea Party was one of many growing tensions — taxes, restrictions, military presence — that built up over a decade and contributed to the outbreak of war.</p>
          <div id="demoSteps" style="background:#fff;border:1px solid #c3c6d1;border-radius:8px;padding:12px;">
            <p style="font-size:12px;font-weight:700;color:#191c1e;margin-bottom:8px;">📋 STEP-BY-STEP SOLUTION</p>
            ${DEMO_QUESTION.steps.map(s => `<p style="font-size:14px;color:#191c1e;margin-bottom:6px;line-height:1.5;">${s.replace(/^(Step\s+\d+:)/, '<strong>$1</strong>')}</p>`).join('')}
          </div>
          <div style="margin-top:10px;padding:8px 12px;background:#f7f9fb;border-radius:8px;font-size:12px;color:#43474f;">
            📖 <strong>From your study guide:</strong> ${DEMO_QUESTION.studyGuideReference}
          </div>
        </div>

        <!-- Footer with Hint / Show Answer / Submit -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #e0e3e5;">
          <div style="display:flex;gap:4px;">
            <button id="demoHintBtn" style="padding:8px 12px;font-size:13px;font-weight:700;color:#001e40;background:transparent;border:none;border-radius:8px;cursor:pointer;">💡 Hint</button>
            <button id="demoRevealBtn" style="padding:8px 12px;font-size:13px;font-weight:700;color:#43474f;background:transparent;border:none;border-radius:8px;cursor:pointer;">👁 Show Answer</button>
          </div>
          <button id="demoSubmitBtn" style="padding:10px 20px;font-size:13px;font-weight:700;color:#fff;background:#001e40;border:none;border-radius:8px;cursor:pointer;">Submit Answer</button>
        </div>
      </div>

      <!-- Progress bar (below card) -->
      <div style="margin-top:16px;">
        <div style="width:100%;height:6px;background:#e0e3e5;border-radius:999px;overflow:hidden;">
          <div id="demoProgress" style="height:100%;background:#001e40;border-radius:999px;width:60%;transition:width 0.5s ease;"></div>
        </div>
        <p id="demoProgressText" style="text-align:center;font-size:12px;color:#43474f;margin-top:6px;">${DEMO_QUESTION.questionNum} of ${DEMO_QUESTION.totalQuestions} questions</p>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  return wrap;
}

function removeDemoCard() {
  document.getElementById('ged-tour-demo')?.remove();
}

// ---------- Tour steps ----------

const TOUR_STEPS = [
  // --- Orientation ---
  {
    selector: '.sidebar-brand',
    title: 'Welcome to GED Study Guide',
    body: "This is your prep workspace for the GED exam — Math and Social Studies, with AI-generated practice grounded in the official study guides. Let's walk through how everything works.",
    phase: 'sidebar'
  },
  {
    selector: 'a[href="/dashboard"]',
    title: 'Dashboard',
    body: 'Your home base. See per-subject and per-topic progress, your streak, and Priority Review cards for the topics you should work on next.',
    phase: 'sidebar'
  },
  {
    selector: 'a[href="/study_guide"]',
    title: 'Study Guide',
    body: 'The official GED PDFs, embedded in the app with subject tabs. After a wrong answer, the "Review Study Guide" button deep-links to the exact page that covers the concept.',
    phase: 'sidebar'
  },
  {
    selector: 'a[href="/practice_session"]',
    title: 'Practice Sessions',
    body: "The core of the app. Click here, pick a subject → difficulty → topic, and you'll get 10 AI-generated questions in that exact mold. Let me show you what one looks like…",
    phase: 'sidebar'
  },

  // --- Practice demo ---
  {
    selector: '#demoBar',
    title: 'Inside a practice session',
    body: "This is what a practice session looks like. The top bar shows your topic, timer, difficulty, and progress through the 10 questions.",
    phase: 'demo'
  },
  {
    selector: '#demoQuestion',
    title: 'The question',
    body: "Each question is generated to test a specific GED concept. Social Studies questions like this one include a short passage you read, then a question about it.",
    phase: 'demo'
  },
  {
    selector: '#demoOptions',
    title: 'Multiple choice',
    body: "Pick the option you think is right. The order is shuffled server-side, so the correct answer is never always 'B'.",
    phase: 'demo'
  },
  {
    selector: '#demoHintBtn',
    title: 'Stuck? Get a hint',
    body: "If you don't know where to start, click Hint for a nudge in the right direction — without giving away the answer.",
    phase: 'demo',
    onBeforeStep: () => { document.getElementById('demoHint').style.display = 'block'; }
  },
  {
    selector: '#demoRevealBtn',
    title: 'Show Answer',
    body: "Need to see the worked solution before you guess? Click Show Answer. The question is marked incorrect in your score, but you get the full step-by-step explanation immediately.",
    phase: 'demo'
  },
  {
    selector: '#demoSubmitBtn',
    title: 'Submit your answer',
    body: "When you're ready, Submit. Claude grades it and gives you instant feedback — correct or not, with an explanation.",
    phase: 'demo',
    onBeforeStep: () => {
      // Highlight option B as the chosen answer + reveal feedback
      const opt = document.querySelector('.demo-option[data-letter="B"]');
      if (opt) {
        opt.style.background = '#ecfdf5';
        opt.style.borderColor = '#10b981';
        const input = opt.querySelector('input');
        if (input) input.checked = true;
      }
      document.getElementById('demoFeedback').style.display = 'block';
      document.getElementById('demoHint').style.display = 'none';
    }
  },
  {
    selector: '#demoSteps',
    title: 'Step-by-step solution',
    body: "Every question — right OR wrong — gets a step-by-step breakdown. This is how you learn the reasoning, not just the answer.",
    phase: 'demo'
  },
  {
    selector: '#demoProgress',
    title: 'Track your progress',
    body: "The bar fills as you work through the 10 questions. Your accuracy weighted by difficulty (Easy=1, Medium=2, Hard=3) becomes your topic mastery score on the dashboard.",
    phase: 'demo'
  },

  // --- Outro ---
  {
    selector: '#ged-help-btn',
    title: "That's the flow",
    body: "Re-run this tour any time from the Help button. When you're ready, hit Practice Sessions to start your first real one. Good luck!",
    phase: 'sidebar'
  }
];

export async function startSiteTour() {
  const SiteTour = await loadTourEngine();
  let demoEl = null;

  const tour = new SiteTour({
    steps: TOUR_STEPS,
    onStart: () => {
      // Build the demo card lazily on first transition into the demo phase,
      // not at the very start — keeps initial steps clean.
    },
    onBeforeStep: (step) => {
      // Make sure the demo card exists for any demo-phase step, and tear it
      // down once we move on to a non-demo step.
      if (step.phase === 'demo' && !document.getElementById('ged-tour-demo')) {
        demoEl = buildDemoCard();
      }
      if (step.phase !== 'demo' && document.getElementById('ged-tour-demo')) {
        removeDemoCard();
      }
      // Step-specific setup (e.g., reveal the hint panel, fill in feedback).
      if (typeof step.onBeforeStep === 'function') {
        try { step.onBeforeStep(); } catch (e) { console.warn('[tour] step setup failed:', e); }
      }
    },
    onEnd: () => {
      removeDemoCard();
    }
  });
  tour.start();
}
