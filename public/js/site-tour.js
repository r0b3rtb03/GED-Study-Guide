// GED Study Guide — guided product tour.
// Lazily loads the tour engine (tour.js + tour.css) on first invocation,
// then runs a scripted walkthrough of the main features.
//
// Triggered from the Help button in the sidebar footer (layout.js). The
// tour engine itself is generic; this file just supplies the steps and
// the bootstrapping plumbing.

let _enginePromise = null;
function loadTourEngine() {
  if (_enginePromise) return _enginePromise;
  _enginePromise = new Promise((resolve, reject) => {
    // Stylesheet
    if (!document.querySelector('link[href="/js/tour.css"]')) {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = '/js/tour.css';
      document.head.appendChild(link);
    }
    // Script
    if (window.SiteTour) return resolve(window.SiteTour);
    const script = document.createElement('script');
    script.src = '/js/tour.js';
    script.onload  = () => resolve(window.SiteTour);
    script.onerror = () => reject(new Error('Failed to load /js/tour.js'));
    document.head.appendChild(script);
  });
  return _enginePromise;
}

// The steps. Each one points at an existing DOM element in the layout
// shell. `skipIfHidden: true` (default) means steps whose target isn't
// visible — e.g. the sidebar items on mobile — get gracefully skipped.
const TOUR_STEPS = [
  {
    selector: '.sidebar-brand',
    title: 'Welcome to GED Study Guide',
    body: "This is your prep workspace for the GED exam — Math and Social Studies, with AI-generated practice questions grounded in the official study guides. Let's take a quick tour."
  },
  {
    selector: 'a[href="/dashboard"]',
    title: 'Dashboard',
    body: 'Your home base. See your overall progress, per-subject and per-topic accuracy, study streak, and any recommended topics to review.'
  },
  {
    selector: 'a[href="/study_notes"]',
    title: 'Study Notes',
    body: "Curated AI-summarized notes per topic. Quick refreshers before you dive into a practice session — and you can upload your own materials too."
  },
  {
    selector: 'a[href="/study_guide"]',
    title: 'Study Guide',
    body: 'The official GED study guide PDFs, embedded right in the app with subject tabs. The "Review Study Guide" buttons on wrong answers deep-link straight to the page that covers that concept.'
  },
  {
    selector: 'a[href="/practice_session"]',
    title: 'Practice Sessions',
    body: 'The core of the app. Pick a subject → difficulty → topic, and get 10 GED-style questions with step-by-step explanations. Use <strong>Show Answer</strong> if you want to study a worked solution.'
  },
  {
    selector: 'a[href="/growth_history"]',
    title: 'History',
    body: 'Every session you complete is saved here with a date, topic, score, and difficulty so you can see how you\'re improving over time.'
  },
  {
    selector: '#ged-theme-btn',
    title: 'Light / Dark mode',
    body: 'Toggle anytime. The choice persists across sessions, so you only need to set it once.'
  },
  {
    selector: '#ged-collapse-btn',
    title: 'Collapse the sidebar',
    body: 'Click the chevron to shrink the sidebar down to icons only — gives more room for the study guide PDF or a practice session. Hover the collapsed sidebar to expand it temporarily.'
  },
  {
    selector: 'a[href="/account_settings"]',
    title: 'Account Settings',
    body: "Update your profile, change your password, and manage notification preferences."
  },
  {
    selector: '#ged-help-btn',
    title: 'That\'s the tour',
    body: 'You can re-run this tour any time from the Help button. Good luck with your studying!'
  }
];

export async function startSiteTour() {
  const SiteTour = await loadTourEngine();
  const tour = new SiteTour({ steps: TOUR_STEPS });
  tour.start();
}
