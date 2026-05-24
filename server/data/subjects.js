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
    description: 'Algebra, geometry, fractions, statistics, and more.',
    intro: {
      title: 'Before you start',
      lead: "You'll be asked to:",
      bullets: [
        'Solve real-world problems using whole numbers, fractions, decimals, and percents',
        'Work with algebraic expressions, linear equations, and basic functions',
        'Compute area, perimeter, volume, and surface area of common shapes',
        'Read and interpret graphs, tables, and statistical data',
        'Identify whether each question is calculator-allowed (the badge on the card will tell you)'
      ]
    }
  },
  'social-studies': {
    slug: 'social-studies',
    name: 'Social Studies',
    fullName: 'GED Social Studies',
    icon: 'public',
    pdfPath: '/social-studies-guide.pdf',
    cacheKey: 'social-studies',
    description: 'Civics, government, US history, economics, and geography.',
    intro: {
      title: 'Before you start',
      lead: "You'll be asked to:",
      bullets: [
        'Analyze cause-and-effect relationships',
        'Describe the connections between people, places, environments, processes, and events',
        'Put events in order and understand the steps in a process (for example, how a bill becomes a law)',
        'Analyze the relationship of events, processes, and/or ideas — for example, whether earlier events actually caused later ones or simply occurred before them'
      ]
    }
  },
  'english': {
    slug: 'english',
    name: 'English',
    fullName: 'GED Reasoning Through Language Arts',
    icon: 'menu_book',
    pdfPath: '/english-guide.pdf',
    cacheKey: 'english',
    description: 'Reading comprehension, grammar, vocabulary, and writing.',
    intro: {
      title: 'Before you start',
      lead: "You'll be asked to:",
      bullets: [
        'Read closely and pull main ideas, details, and inferences from passages',
        'Use context clues to figure out unfamiliar vocabulary',
        'Apply standard English grammar, punctuation, and usage rules',
        'Analyze how authors structure arguments and use evidence',
        'Compose clear, well-organized responses to a writing prompt'
      ]
    }
  },
  'science': {
    slug: 'science',
    name: 'Science',
    fullName: 'GED Science',
    icon: 'science',
    pdfPath: '/science-guide.pdf',
    cacheKey: 'science',
    description: 'Life science, physical science, and earth & space science.',
    intro: {
      title: 'Before you start',
      lead: "You'll be asked to:",
      bullets: [
        'Apply the scientific method: hypothesis, variables, controls, conclusions',
        'Interpret data tables, charts, and graphs of experimental results',
        'Reason about life-science concepts (cells, genetics, ecosystems, evolution)',
        'Apply physical-science concepts (matter, energy, forces, chemical reactions)',
        'Reason about earth and space science (geology, weather, the solar system)'
      ]
    }
  }
};

export const SUBJECT_SLUGS = Object.keys(SUBJECTS);

export function isValidSubject(slug) {
  return Object.prototype.hasOwnProperty.call(SUBJECTS, slug);
}
