export const GED_TOPIC_GUIDES = {
  'algebra': {
    name: 'Algebra',
    scope: `
- Evaluating and simplifying algebraic expressions (e.g., 3x + 2y when x=4, y=1)
- Solving one- and two-variable equations (e.g., 2x + 5 = 13)
- Solving inequalities and graphing on a number line
- Factoring simple expressions (e.g., 6x² + 9x = 3x(2x + 3))
- Polynomials: adding, subtracting, basic multiplication
- Systems of equations (substitution and elimination)
- Word problems: age, mixture, rate × time = distance`
  },
  'linear-equations': {
    name: 'Linear Equations & Graphs',
    scope: `
- Slope formula: m = (y2 - y1) / (x2 - x1)
- Slope-intercept form: y = mx + b
- Point-slope form: y - y1 = m(x - x1)
- Finding x- and y-intercepts
- Graphing a line from an equation
- Writing an equation from two points or a graph
- Parallel lines (same slope) and perpendicular lines (negative reciprocal)
- Interpreting slope and intercepts in real-world contexts`
  },
  'fractions': {
    name: 'Fractions, Decimals & Percents',
    scope: `
- Simplifying fractions and finding equivalent fractions
- Adding, subtracting, multiplying, dividing fractions and mixed numbers
- Converting between fractions, decimals, and percents
- Percent problems: percent of a number, percent change, percent error
- Ratio and proportion
- Unit rate and unit price
- Real-world contexts: discounts, tax, tips, interest`
  },
  'geometry': {
    name: 'Geometry Basics',
    scope: `
- Perimeter and area of rectangles, squares, triangles, parallelograms, trapezoids
- Circumference and area of circles (π ≈ 3.14)
- Volume of rectangular prisms, cylinders, cones, pyramids, spheres
- Surface area of basic 3D shapes
- Pythagorean theorem: a² + b² = c²
- Properties of angles: supplementary, complementary, vertical, alternate interior
- Similar and congruent triangles
- Coordinate geometry: distance formula, midpoint formula`
  },
  'stats': {
    name: 'Statistics & Data',
    scope: `
- Reading and interpreting bar graphs, line graphs, pie charts, histograms
- Mean, median, mode, and range
- Weighted averages
- Probability: basic and compound (independent/dependent)
- Counting principle and combinations
- Box plots (quartiles, IQR)
- Scatter plots: correlation, line of best fit
- Two-way tables and relative frequency`
  }
};

export const GED_TOPIC_SLUGS = Object.keys(GED_TOPIC_GUIDES);
