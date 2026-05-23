// Subject registry. Each subject ties together:
//   - the PDF file served to the user (under /public)
//   - the cache key the studyGuideLoader uses
//   - UI metadata (label, icon, accent color hint)
//
// Adding a new subject (e.g., Science) is: drop a PDF under public/,
// add an entry here, and add its topic definitions in gedTopicGuides.js.

export const SUBJECTS = {
  'math': {
    slug: 'math',
    name: 'Math',
    fullName: 'GED Mathematical Reasoning',
    icon: 'function',
    pdfPath: '/study-guide.pdf',
    cacheKey: 'math',
    description: 'Algebra, geometry, fractions, statistics, and more.'
  },
  'social-studies': {
    slug: 'social-studies',
    name: 'Social Studies',
    fullName: 'GED Social Studies',
    icon: 'public',
    pdfPath: '/social-studies-guide.pdf',
    cacheKey: 'social-studies',
    description: 'Civics, government, US history, economics, and geography.'
  }
};

export const SUBJECT_SLUGS = Object.keys(SUBJECTS);

export function isValidSubject(slug) {
  return Object.prototype.hasOwnProperty.call(SUBJECTS, slug);
}
