// Subject-aware topic guides.
//
// Each subject has a set of topics; each topic has a page range in its
// study-guide PDF and a concept-to-page index. The concept index is fed
// to Gemini at generation time so the LLM can return a precise
// studyGuidePage. See server/services/ai.js > buildGenerationPrompt.
//
// Adding a new topic: add an entry under the right subject, give it a
// pageRange and a concepts array. No other code change is needed —
// the topic auto-appears in the practice picker, dashboard analytics,
// and recommended review.

const MATH_TOPICS = {
  'algebra': {
    name: 'Algebra',
    pageRange: [22, 32],
    sectionName: 'Basic Algebra',
    concepts: [
      { page: 22, name: 'Add, subtract, multiply, and factor linear expressions' },
      { page: 23, name: 'Algebraic expressions — creation' },
      { page: 24, name: 'Add, subtract, multiply, divide, and factor polynomials' },
      { page: 25, name: 'Create polynomials from written descriptions' },
      { page: 26, name: 'Add, subtract, multiply and divide rational expressions' },
      { page: 27, name: 'Write an expression from a written description' },
      { page: 28, name: 'Use linear equations to solve real-world problems' },
      { page: 29, name: 'Solve a system of two linear equations' },
      { page: 30, name: 'Solve inequalities and graph on a number line' },
      { page: 31, name: 'Quadratic equations with one variable' },
      { page: 32, name: 'Evaluate algebraic expressions' }
    ],
    scope: `
- Evaluating and simplifying algebraic expressions
- Solving one- and two-variable equations
- Solving inequalities and graphing on a number line
- Factoring simple expressions
- Polynomials and rational expressions
- Systems of equations
- Quadratic equations
- Word problems`
  },
  'linear-equations': {
    name: 'Linear Equations & Graphs',
    pageRange: [33, 42],
    sectionName: 'Graphs and Functions',
    concepts: [
      { page: 33, name: 'Locate points and graph equations' },
      { page: 34, name: 'Slope of a line from a graph, equation, or table' },
      { page: 35, name: 'Proportional relationships for equations and graphs' },
      { page: 36, name: 'Features of graphs and tables for linear and nonlinear relationships' },
      { page: 37, name: 'Slope and a point on a line' },
      { page: 38, name: 'Equation of a line from two points' },
      { page: 39, name: 'Use slope of a line (parallel/perpendicular)' },
      { page: 40, name: 'Functions shown in different ways' },
      { page: 41, name: 'Functions in tables and graphs' },
      { page: 42, name: 'Evaluating functions' }
    ],
    scope: `
- Slope formula and slope-intercept form
- Point-slope form
- x- and y-intercepts
- Graphing lines from equations
- Writing equations from two points
- Parallel and perpendicular lines
- Functions in tables, graphs, equations`
  },
  'fractions': {
    name: 'Fractions, Decimals & Percents',
    pageRange: [3, 12],
    sectionName: 'Basic Math',
    concepts: [
      { page: 3,  name: 'Order fractions and decimals on a number line' },
      { page: 4,  name: 'Multiples and factors' },
      { page: 5,  name: 'Simplify exponents' },
      { page: 6,  name: 'Distance between numbers on a number line (absolute value)' },
      { page: 7,  name: 'Whole numbers, fractions, and decimal problems' },
      { page: 8,  name: 'Squares, square roots, cubes, and cube roots' },
      { page: 9,  name: 'Undefined expressions' },
      { page: 10, name: 'Unit rates' },
      { page: 11, name: 'Objects at scale' },
      { page: 12, name: 'Multiple-step problems with ratios, proportions, and percents' }
    ],
    scope: `
- Order, compare, and simplify fractions and decimals
- Convert between fractions, decimals, and percents
- Percent of a number, percent change
- Ratio, proportion, unit rate
- Real-world discount/tax/tip problems`
  },
  'geometry': {
    name: 'Geometry Basics',
    pageRange: [13, 17],
    sectionName: 'Geometry Plus',
    concepts: [
      { page: 13, name: 'Side lengths of shapes given area or perimeter' },
      { page: 14, name: 'Area and perimeter of two-dimensional shapes' },
      { page: 15, name: 'Area, circumference, radius, and diameter of a circle' },
      { page: 16, name: 'Pythagorean theorem' },
      { page: 17, name: 'Volume and surface area of three-dimensional shapes' }
    ],
    scope: `
- Perimeter and area of rectangles, triangles, polygons, trapezoids
- Circumference and area of circles
- Volume and surface area of rectangular prisms, cylinders, cones, pyramids, spheres
- Pythagorean theorem`
  },
  'stats': {
    name: 'Statistics & Data',
    pageRange: [18, 21],
    sectionName: 'Geometry Plus (Data section)',
    concepts: [
      { page: 18, name: 'Graphical data: bar graphs, circle graphs, dot plots, histograms, box plots, tables' },
      { page: 19, name: 'Mean, median, mode, and range' },
      { page: 20, name: 'Counting techniques' },
      { page: 21, name: 'Probability of an event' }
    ],
    scope: `
- Reading and interpreting graphs and tables
- Mean, median, mode, range, weighted averages
- Counting and combinations
- Basic and compound probability
- Box plots and quartiles
- Scatter plots and correlation`
  }
};

// Social Studies. The official PDF is organized by SKILLS (reading,
// analysis, numbers/graphs), but user-facing topics follow the GED
// CONTENT domains the test actually covers. Each content topic maps to
// the most relevant skill pages in the PDF — that's what gets fed to
// Gemini, and what the Review Study Guide button deep-links to.
const SOCIAL_STUDIES_TOPICS = {
  'civics-government': {
    name: 'Civics & Government',
    pageRange: [4, 12],
    sectionName: 'Reading for Meaning in Social Studies',
    concepts: [
      { page: 4,  name: 'Main ideas and details in social studies readings' },
      { page: 6,  name: 'Social studies vocabulary (e.g., "checks and balances", "federalism")' },
      { page: 8,  name: 'How authors use language in civic documents and speeches' },
      { page: 10, name: 'Fact versus opinion in political writing' },
      { page: 11, name: 'Claims and evidence — supported vs. unsupported arguments' }
    ],
    scope: `
- Structure of the U.S. government: branches, separation of powers, federalism
- The Constitution and Bill of Rights
- Civic responsibilities, voting rights, civil rights
- How laws are made; checks and balances
- Founding documents and political theory (Declaration, Federalist Papers, etc.)`
  },
  'us-history': {
    name: 'U.S. History',
    pageRange: [13, 17],
    sectionName: 'Analyzing Historical Events and Arguments',
    concepts: [
      { page: 13, name: 'Making inferences from historical evidence' },
      { page: 14, name: 'Connections between historical events (cause-and-effect, sequence)' },
      { page: 16, name: 'Effect of different social studies concepts on an argument or point-of-view' },
      { page: 17, name: 'Identifying bias and propaganda in historical readings' }
    ],
    scope: `
- Colonial era through American Revolution
- The Constitution and early Republic
- Civil War, Reconstruction, civil rights movements
- 20th century: World Wars, Great Depression, Cold War
- Major political, economic, and social changes
- Cause-and-effect of major events`
  },
  'economics': {
    name: 'Economics',
    pageRange: [18, 24],
    sectionName: 'Using Numbers and Graphs in Social Studies',
    concepts: [
      { page: 18, name: 'Data in visual form: maps, charts, graphs, tables' },
      { page: 20, name: 'Dependent and independent variables in economic data' },
      { page: 22, name: 'Correlation versus causation in economic trends' },
      { page: 24, name: 'Statistics (mean, median, mode, range) applied to social data' }
    ],
    scope: `
- Supply and demand
- Markets, scarcity, opportunity cost
- Microeconomics vs. macroeconomics basics
- GDP, inflation, unemployment, recession
- Reading economic charts and tables
- Personal finance: budgeting, credit, interest`
  },
  'geography': {
    name: 'Geography',
    pageRange: [18, 22],
    sectionName: 'Using Numbers and Graphs in Social Studies',
    concepts: [
      { page: 18, name: 'Data in visual form: maps, charts, graphs, tables' },
      { page: 20, name: 'Dependent and independent variables in geographic data' },
      { page: 22, name: 'Correlation versus causation in geographic patterns' }
    ],
    scope: `
- Map reading: physical and political maps, latitude/longitude, scale
- Major regions, climate zones, natural resources
- Human geography: population, migration, urbanization
- How geography influences history, economics, culture
- Environmental issues`
  },
  'world-history': {
    name: 'World History',
    pageRange: [13, 17],
    sectionName: 'Analyzing Historical Events and Arguments',
    concepts: [
      { page: 13, name: 'Making inferences from historical evidence' },
      { page: 14, name: 'Connections between events across cultures and time periods' },
      { page: 16, name: 'Effect of different social studies concepts on a point-of-view' }
    ],
    scope: `
- Major ancient civilizations
- Medieval and Renaissance Europe
- Age of exploration and colonization
- Industrial revolution, World Wars, decolonization
- Global political and cultural movements
- Comparing world events to U.S. history`
  }
};

export const TOPICS_BY_SUBJECT = {
  'math': MATH_TOPICS,
  'social-studies': SOCIAL_STUDIES_TOPICS
};

// Legacy export — kept for any callers that haven't been migrated yet.
// New code should use TOPICS_BY_SUBJECT[subject].
export const GED_TOPIC_GUIDES = MATH_TOPICS;
export const GED_TOPIC_SLUGS = Object.keys(MATH_TOPICS);

export function getTopic(subject, slug) {
  return TOPICS_BY_SUBJECT[subject]?.[slug] || null;
}
export function getTopicSlugs(subject) {
  return Object.keys(TOPICS_BY_SUBJECT[subject] || {});
}
export function topicPageIndex(subject, slug) {
  const t = getTopic(subject, slug);
  if (!t) return '';
  return t.concepts.map(c => `  Page ${c.page}: ${c.name}`).join('\n');
}
