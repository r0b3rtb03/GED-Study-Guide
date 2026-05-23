// Each topic maps to a page range in the official GED study guide
// (data/GED-Study-Guide-Math.pdf, served at /study-guide.pdf).
// The `concepts` array gives Gemini specific page numbers per concept
// so it can return a precise `studyGuideReference` like "Pythagorean theorem — Page 16".

export const GED_TOPIC_GUIDES = {
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

export const GED_TOPIC_SLUGS = Object.keys(GED_TOPIC_GUIDES);

// Format the per-concept index for injection into the Gemini prompt.
export function topicPageIndex(slug) {
  const t = GED_TOPIC_GUIDES[slug];
  if (!t) return '';
  return t.concepts.map(c => `  Page ${c.page}: ${c.name}`).join('\n');
}
