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
  // ===== Orientation (sidebar + top bar) =====
  {
    selector: '.sidebar-brand',
    title: 'Welcome to GED Study Guide',
    body: "Your prep workspace for all four GED subjects — Math, Social Studies, English, and Science. Practice is AI-generated and grounded in the official study guides. Let's walk through the app one section at a time.",
    phase: 'sidebar',
    section: 'orientation', sectionLabel: 'Dashboard tour'
  },
  {
    selector: 'a[href="/dashboard"]',
    title: 'Dashboard',
    body: 'Your home base. Shows your overall score, current streak, per-subject progress, and Priority Review cards for the topics you most need to work on.',
    phase: 'sidebar', section: 'orientation', sectionLabel: 'Dashboard tour'
  },
  {
    selector: 'a[href="/study_notes"]',
    title: 'Study Notes',
    body: 'Hand-written notes for every topic — concise sections with key formulas and tips. Faster than reading the PDF when you just want a refresher.',
    phase: 'sidebar', section: 'orientation', sectionLabel: 'Dashboard tour'
  },
  {
    selector: 'a[href="/study_guide"]',
    title: 'Study Guide',
    body: 'The official GED PDFs, embedded with subject tabs. After a wrong answer, the "Review Study Guide" button deep-links to the exact page that covers the concept.',
    phase: 'sidebar', section: 'orientation', sectionLabel: 'Dashboard tour'
  },
  {
    selector: 'a[href="/practice_session"]',
    title: 'Practice Sessions',
    body: "The core of the app. Pick subject → difficulty → topic and get 10 AI-generated questions tailored to that combination. I'll show you what one looks like in a minute.",
    phase: 'sidebar', section: 'orientation', sectionLabel: 'Dashboard tour'
  },
  {
    selector: 'a[href="/growth_history"]',
    title: 'History',
    body: 'Performance trend chart (Week/Month), Subject Mastery overview, and a filterable list of every session you\'ve completed.',
    phase: 'sidebar', section: 'orientation', sectionLabel: 'Dashboard tour'
  },
  {
    selector: '#ged-topbar-search',
    title: 'Top bar search',
    body: 'Quickly jump to a topic by typing its name. The profile chip on the right opens a panel with your account info and sign-out.',
    phase: 'sidebar', section: 'orientation', sectionLabel: 'Dashboard tour'
  },

  // ===== Dashboard page (only fires if you're ON the dashboard) =====
  {
    selector: '#statsGrid',
    title: 'Your stats at a glance',
    body: 'Four numbers that summarize your prep: overall coverage score, total study time, completed sessions, and your daily streak. Click "All Stats" for a deeper breakdown.',
    section: 'dashboard', sectionLabel: 'Study Notes tour'
  },
  {
    selector: '#recommendedReviewSection',
    title: 'Priority Review',
    body: "Topics you've scored below 80% on. <strong>Red badge</strong> means &lt;60% (Needs attention), <strong>orange</strong> means 60–79% (Needs a refresher). Each card has buttons for Study Notes, Study Guide, and a fresh Practice set on that exact topic + difficulty.",
    section: 'dashboard', sectionLabel: 'Study Notes tour'
  },
  {
    selector: '#prFilters',
    title: 'Filter and sort',
    body: 'Sort the list by lowest score, highest score, difficulty, or subject. The pill rows narrow by priority band, difficulty, or subject — combine them to find exactly what you want to drill.',
    section: 'dashboard', sectionLabel: 'Study Notes tour'
  },
  {
    selector: '#quickStart',
    title: 'Quick Start',
    body: 'One-click into the most recent subject. Each tile shows your overall percent and links straight into a practice session.',
    section: 'dashboard', sectionLabel: 'Study Notes tour'
  },
  {
    selector: '#topicProgress',
    title: 'Detailed Progress',
    body: 'Per-topic mastery, broken out by difficulty. "Easy 7/10" means you got 7 of 10 Easy questions correct across all your sessions on that topic. Difficulties you haven\'t tried show "not attempted".',
    section: 'dashboard', sectionLabel: 'Study Notes tour'
  },

  // ===== Study Notes page =====
  {
    selector: '.ged-catalog-scroll',
    title: 'Subject Catalog',
    body: 'Every topic, grouped by subject. Topics with a "Needs Review" badge are ones your recent scores say you should revisit. The catalog scrolls on its own so it stays put while you read the notes on the right.',
    section: 'study_notes', sectionLabel: 'Study Guide tour'
  },
  {
    selector: '#topicHero',
    title: 'Topic header',
    body: 'The big heading, a one-line description of the topic, and your current mastery chip — green if you\'ve mastered it, orange/red if it still needs work.',
    section: 'study_notes', sectionLabel: 'Study Guide tour'
  },
  {
    selector: '#notesBody',
    title: 'The notes themselves',
    body: 'Numbered sections cover the must-know concepts. Each one ends with a Key Formulas box (when applicable) and a bullet list of tips that apply directly to GED-style questions.',
    section: 'study_notes', sectionLabel: 'Study Guide tour'
  },
  {
    selector: '#practiceCta',
    title: 'Generate Practice Problems',
    body: 'When you\'re done reading, this button starts a 10-question practice set on this exact topic.',
    section: 'study_notes', sectionLabel: 'Study Guide tour'
  },
  {
    selector: '#markCompleteBtn',
    title: 'Mark as Complete',
    body: 'Toggle this when you\'ve finished a topic\'s notes. Completed topics get a green checkmark in the catalog so you can track which you\'ve already covered.',
    section: 'study_notes', sectionLabel: 'Study Guide tour'
  },

  // ===== Study Guide page =====
  {
    selector: '#subjectTabs',
    title: 'Subject tabs',
    body: 'Switch between the four official GED study guide PDFs. Your last selection is remembered between visits.',
    section: 'study_guide', sectionLabel: 'Practice tour'
  },
  {
    selector: '#downloadLink',
    title: 'Download for offline study',
    body: 'Save a copy of the PDF locally if you want to study without internet.',
    section: 'study_guide', sectionLabel: 'Practice tour'
  },

  // ===== Practice page (real session picker, not the demo) =====
  {
    selector: '#subjectStep',
    title: 'Pick a subject',
    body: 'Step 1 of starting a practice session. Choose the subject you want to drill — the rest of the page changes to match.',
    section: 'practice_picker', sectionLabel: 'Live demo'
  },
  {
    selector: '#difficultyStep',
    title: 'Pick a difficulty',
    body: 'Easy / Medium / Hard. Your topic-mastery score weights each difficulty differently (Hard counts the most), so spend time on what you actually need.',
    section: 'practice_picker', sectionLabel: 'Live demo'
  },
  {
    selector: '#topicStep',
    title: 'Pick a topic',
    body: 'Each subject has 5 topics. Once you pick one, the right-hand "Ready to begin" card lights up — hit Start practice and the AI starts generating your first question.',
    section: 'practice_picker', sectionLabel: 'Live demo'
  },

  // ===== Practice demo (synthetic question card) =====
  {
    selector: '#demoBar',
    title: 'Inside a practice session',
    body: "This is what a practice session looks like once you start. The top bar shows your topic, timer, difficulty, and progress through the 10 questions.",
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour'
  },
  {
    selector: '#demoQuestion',
    title: 'The question',
    body: "Each question is generated to test a specific GED concept. Social Studies and English questions often include a short passage you read first.",
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour'
  },
  {
    selector: '#demoOptions',
    title: 'Multiple choice',
    body: "Pick the option you think is right. The order is shuffled server-side, so the correct answer is never always 'B'.",
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour'
  },
  {
    selector: '#demoHintBtn',
    title: 'Stuck? Get a hint',
    body: "Click Hint for a nudge in the right direction — without giving away the answer.",
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour',
    onBeforeStep: () => { document.getElementById('demoHint').style.display = 'block'; }
  },
  {
    selector: '#demoRevealBtn',
    title: 'Show Answer',
    body: "Need to see the worked solution before you guess? Click Show Answer. The question is marked incorrect in your score, but you get the full step-by-step explanation immediately.",
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour'
  },
  {
    selector: '#demoSubmitBtn',
    title: 'Submit your answer',
    body: "When you're ready, Submit. Claude grades it and gives you instant feedback — correct or not, with an explanation.",
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour',
    onBeforeStep: () => {
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
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour'
  },
  {
    selector: '#demoProgress',
    title: 'Track your progress',
    body: "The bar fills as you work through the 10 questions. Your accuracy weighted by difficulty (Easy=1, Medium=2, Hard=3) becomes your topic mastery score on the dashboard.",
    phase: 'demo', section: 'practice_demo', sectionLabel: 'History tour'
  },

  // ===== History page =====
  {
    selector: '#performanceChart',
    title: 'Performance Trend',
    body: 'Your average score per day plotted over the last week or month. Toggle the range with the Week/Month switch above the chart.',
    section: 'history', sectionLabel: 'Wrap up'
  },
  {
    selector: '#masteryList',
    title: 'Subject Mastery',
    body: 'A bar for each subject showing your overall coverage. Use the "Review Weak Topics" button below the list to jump straight into a session on the weakest area.',
    section: 'history', sectionLabel: 'Wrap up'
  },
  {
    selector: '#topicPills',
    title: 'Session History',
    body: "Filter your past sessions by topic. The table below shows the date, topic, score, and time spent on every session you've completed.",
    section: 'history', sectionLabel: 'Wrap up'
  },

  // ===== Outro =====
  {
    selector: '#ged-topbar-help',
    title: "That's the tour",
    body: "Re-run this tour any time from the Help button up here. Tip: each section of the tour can be skipped individually using the 'Skip section' button. Good luck on the GED!",
    section: 'outro', sectionLabel: 'Done'
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
