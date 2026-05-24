// Pre-written study notes for every topic, served directly by
// /api/notes/:topic. Eliminates the per-request Gemini/Claude call
// that used to format raw PDF text on the fly — pages now load
// instantly and the wording is consistent across sessions.
//
// Shape mirrors what structureNotes() returns:
//   { title, sections: [{ heading, content, keyFormulas, tips }] }
// so the existing study_notes.html renderer needs no changes.

export const STATIC_NOTES = {
  'math': {
    'algebra': {
      title: 'Algebra',
      sections: [
        {
          heading: 'Algebraic Expressions',
          content: 'An algebraic expression combines numbers, variables, and operations (no equals sign). To simplify, combine like terms — terms with the same variable raised to the same power. To evaluate an expression, substitute the given value for each variable and follow the order of operations (PEMDAS).',
          keyFormulas: [
            'Distributive property: a(b + c) = ab + ac',
            'Like terms: 3x + 5x = 8x; 3x + 5y stays as 3x + 5y'
          ],
          tips: [
            'Always distribute the sign of the term in front of a parenthesis — −(x − 4) becomes −x + 4.',
            'Read word problems twice: once for the situation, once to translate into symbols.'
          ]
        },
        {
          heading: 'Linear Equations',
          content: 'A linear equation has variables raised only to the first power. Solve by isolating the variable: do the same operation to both sides until the variable is alone. For two-variable systems, use substitution or elimination.',
          keyFormulas: [
            'One-step: x + a = b  →  x = b − a',
            'Two-step: ax + b = c  →  x = (c − b) / a',
            'Substitution: solve one equation for one variable, plug into the other'
          ],
          tips: [
            'Always check your answer by plugging it back into the original equation.',
            'Clear fractions first by multiplying both sides by the common denominator.'
          ]
        },
        {
          heading: 'Inequalities',
          content: 'Solve inequalities like equations, with one critical rule: when you multiply or divide both sides by a negative number, flip the inequality sign. Graph the solution on a number line — open circle for < or >, closed circle for ≤ or ≥.',
          keyFormulas: [
            'If −2x < 6, then x > −3 (flip the sign!)',
            'Compound: a < x < b means x is between a and b'
          ],
          tips: [
            'The flip rule is the #1 missed step on the GED — slow down on negatives.',
            'Use a test point (often 0) to check which side of the line to shade.'
          ]
        },
        {
          heading: 'Polynomials and Factoring',
          content: 'A polynomial is a sum of terms like 3x² + 2x − 5. Add or subtract by combining like terms. Multiply using distribution (FOIL for two binomials). Factor by pulling out the greatest common factor or by reversing FOIL.',
          keyFormulas: [
            'FOIL: (a + b)(c + d) = ac + ad + bc + bd',
            'Difference of squares: a² − b² = (a + b)(a − b)',
            'Trinomial: x² + bx + c = (x + p)(x + q) where p + q = b and pq = c'
          ],
          tips: [
            'Always factor out the GCF first — it makes the rest easier.',
            'Check factoring by FOILing the result back out.'
          ]
        },
        {
          heading: 'Quadratic Equations',
          content: 'A quadratic has the form ax² + bx + c = 0. Solve by factoring when possible, by the quadratic formula otherwise. Every quadratic has up to two real solutions.',
          keyFormulas: [
            'Quadratic formula: x = (−b ± √(b² − 4ac)) / 2a',
            'Discriminant b² − 4ac > 0: two real solutions; = 0: one; < 0: no real solutions'
          ],
          tips: [
            'Try factoring first — it’s faster when it works.',
            'When using the formula, compute b² − 4ac as a single step before taking the square root.'
          ]
        }
      ]
    },

    'linear-equations': {
      title: 'Linear Equations & Graphs',
      sections: [
        {
          heading: 'The Coordinate Plane',
          content: 'Points are written (x, y) — x is horizontal, y is vertical. The plane has four quadrants numbered counter-clockwise from upper right. To graph an equation, plot enough (x, y) pairs that satisfy it to see the pattern.',
          keyFormulas: [
            'Origin: (0, 0)',
            'x-intercept: where y = 0; y-intercept: where x = 0'
          ],
          tips: [
            'A T-table (x | y) is the fastest way to graph an unfamiliar equation.',
            'For a line, two points are enough — but plot three to catch arithmetic mistakes.'
          ]
        },
        {
          heading: 'Slope',
          content: 'Slope measures steepness — how much y changes for each unit x changes. Positive slope rises left-to-right, negative slope falls, zero slope is horizontal, undefined slope is vertical.',
          keyFormulas: [
            'Slope: m = (y₂ − y₁) / (x₂ − x₁)',
            'Slope-intercept form: y = mx + b   (m = slope, b = y-intercept)',
            'Point-slope form: y − y₁ = m(x − x₁)'
          ],
          tips: [
            'Subtract in the same order on top and bottom — y first minus y second matches x first minus x second.',
            'Horizontal lines have slope 0; vertical lines have undefined slope (denominator = 0).'
          ]
        },
        {
          heading: 'Parallel and Perpendicular Lines',
          content: 'Parallel lines have the same slope and never meet. Perpendicular lines meet at right angles, and their slopes are negative reciprocals of each other.',
          keyFormulas: [
            'Parallel: m₁ = m₂',
            'Perpendicular: m₁ × m₂ = −1'
          ],
          tips: [
            'To flip a slope into its perpendicular: invert and change the sign. 2/3 → −3/2.',
            'A horizontal line (slope 0) is perpendicular to a vertical line (undefined slope).'
          ]
        },
        {
          heading: 'Functions',
          content: 'A function assigns exactly one output to each input. Notation f(x) means "the value of f at input x". Functions can be shown as a rule, a table, a graph, or a verbal description — and the GED expects you to move between all four.',
          keyFormulas: [
            'Evaluate: f(3) means replace every x with 3',
            'Linear function: f(x) = mx + b'
          ],
          tips: [
            'Use the vertical-line test: if any vertical line crosses a graph twice, it’s not a function.',
            'When given a table, look for a constant difference in y per unit x — that’s the slope.'
          ]
        }
      ]
    },

    'fractions': {
      title: 'Fractions, Decimals & Percents',
      sections: [
        {
          heading: 'Converting Between Forms',
          content: 'Fractions, decimals, and percents are three ways of writing the same number. To convert, move the decimal or divide.',
          keyFormulas: [
            'Fraction → decimal: divide top by bottom (3/4 = 0.75)',
            'Decimal → percent: move decimal two places right (0.75 = 75%)',
            'Percent → decimal: move decimal two places left (40% = 0.40)'
          ],
          tips: [
            'Memorize common conversions: 1/2 = 0.5, 1/4 = 0.25, 1/3 ≈ 0.333, 1/5 = 0.2.',
            'When ordering mixed forms, convert everything to decimals first.'
          ]
        },
        {
          heading: 'Operations with Fractions',
          content: 'To add or subtract, find a common denominator. To multiply, multiply tops and bottoms. To divide, flip the second fraction and multiply.',
          keyFormulas: [
            'a/b + c/d = (ad + bc) / bd',
            'a/b × c/d = ac / bd',
            'a/b ÷ c/d = a/b × d/c'
          ],
          tips: [
            'Simplify before multiplying — it’s faster than reducing a huge result.',
            '"Of" means multiply: 2/3 of 60 = (2/3) × 60 = 40.'
          ]
        },
        {
          heading: 'Percent of a Number',
          content: 'To find a percent of a number, convert the percent to a decimal and multiply. Percent change measures how much something grew or shrank relative to its original value.',
          keyFormulas: [
            'Percent of: (percent ÷ 100) × whole',
            'Percent change: (new − old) / old × 100',
            'Tax/tip total: original × (1 + rate)'
          ],
          tips: [
            'Discount problems: subtract the discount, OR multiply by (1 − rate).',
            'Always divide by the ORIGINAL value when computing percent change, not the new one.'
          ]
        },
        {
          heading: 'Ratio, Proportion, and Unit Rate',
          content: 'A ratio compares two quantities. A proportion says two ratios are equal. A unit rate expresses a ratio with denominator 1 ($/hr, mi/gal).',
          keyFormulas: [
            'Proportion: a/b = c/d   →   ad = bc (cross-multiply)',
            'Unit rate: total ÷ units (180 mi in 3 hr = 60 mph)'
          ],
          tips: [
            'Set up the proportion with the same units in matching positions (miles over hours on both sides).',
            'For scale problems, write the scale factor as a fraction and multiply.'
          ]
        }
      ]
    },

    'geometry': {
      title: 'Geometry Basics',
      sections: [
        {
          heading: 'Perimeter and Area of 2D Shapes',
          content: 'Perimeter is the total distance around a shape. Area is the space inside it, measured in square units.',
          keyFormulas: [
            'Rectangle: P = 2(l + w), A = l × w',
            'Triangle: A = ½ × b × h',
            'Trapezoid: A = ½ × (b₁ + b₂) × h',
            'Parallelogram: A = b × h'
          ],
          tips: [
            'Height must be perpendicular to the base — not the slanted side.',
            'Always include units: cm vs cm² for perimeter vs area.'
          ]
        },
        {
          heading: 'Circles',
          content: 'A circle is defined by its center and radius. Diameter = 2 × radius. Use π ≈ 3.14 unless asked for an exact answer.',
          keyFormulas: [
            'Circumference: C = 2πr = πd',
            'Area: A = πr²'
          ],
          tips: [
            'Watch for problems that give the diameter when the formula wants the radius — halve it first.',
            '"Exact answer" usually means leave π in the result (e.g., 25π).'
          ]
        },
        {
          heading: 'Pythagorean Theorem',
          content: 'For any right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides. Works only when one angle is 90°.',
          keyFormulas: [
            'a² + b² = c²   (c is the hypotenuse, the side across from the right angle)'
          ],
          tips: [
            'Common Pythagorean triples: 3-4-5, 5-12-13, 8-15-17. Recognize them and skip the calculation.',
            'Make sure you’re solving for the right side — the hypotenuse is always the longest.'
          ]
        },
        {
          heading: 'Volume and Surface Area',
          content: 'Volume is the space inside a 3D shape (cubic units). Surface area is the total area of all its faces (square units).',
          keyFormulas: [
            'Rectangular prism: V = l × w × h',
            'Cylinder: V = πr²h',
            'Cone: V = (1/3)πr²h',
            'Pyramid: V = (1/3) × base area × h',
            'Sphere: V = (4/3)πr³'
          ],
          tips: [
            'Cones and pyramids are exactly one-third of their prism/cylinder counterparts — easy memory trick.',
            'For surface area, sketch each face and sum their areas.'
          ]
        }
      ]
    },

    'stats': {
      title: 'Statistics & Data',
      sections: [
        {
          heading: 'Center: Mean, Median, Mode',
          content: 'Three ways to describe the "middle" of a dataset. Mean = average. Median = middle value when sorted. Mode = most frequent.',
          keyFormulas: [
            'Mean: sum of values ÷ number of values',
            'Median: sort, then pick the middle (or average of two middles if even count)',
            'Weighted mean: Σ(value × weight) / Σ(weights)'
          ],
          tips: [
            'Median is more reliable than mean when there are extreme outliers.',
            'If asked which is largest, plug in tiny example sets to compare quickly.'
          ]
        },
        {
          heading: 'Spread: Range and Quartiles',
          content: 'Range measures how spread out the data is. Quartiles split a sorted dataset into four equal parts. A box plot visualizes the quartiles.',
          keyFormulas: [
            'Range: max − min',
            'IQR (interquartile range): Q3 − Q1',
            'Box plot: Min — Q1 — Median (Q2) — Q3 — Max'
          ],
          tips: [
            'Half of the data lies between Q1 and Q3 — that’s what the box of a box plot shows.',
            'Outliers stretch the range but not the IQR — so IQR is the "robust" measure.'
          ]
        },
        {
          heading: 'Reading Graphs',
          content: 'Bar graphs compare categories; histograms show distributions of numeric data; circle graphs show parts of a whole; dot plots show frequency; scatter plots show two-variable relationships.',
          keyFormulas: [
            'Circle graph slice: (category ÷ total) × 360°',
            'Scatter plot correlation: positive (up), negative (down), none (random)'
          ],
          tips: [
            'Always read the axis labels and the units before answering — graphs are designed to trick you on scale.',
            'On a histogram, bars touch (continuous data); on a bar graph, they don’t (categories).'
          ]
        },
        {
          heading: 'Probability',
          content: 'Probability is a number from 0 to 1 measuring how likely an event is. 0 = impossible, 1 = certain. Express as fraction, decimal, or percent.',
          keyFormulas: [
            'P(event) = favorable outcomes / total outcomes',
            'P(A and B) = P(A) × P(B)   (independent events)',
            'P(A or B) = P(A) + P(B) − P(A and B)'
          ],
          tips: [
            'With dice, coins, or cards, list out total outcomes to avoid double-counting.',
            'Complement: P(not A) = 1 − P(A) — sometimes the fastest path.'
          ]
        }
      ]
    }
  },

  'social-studies': {
    'civics-government': {
      title: 'Civics & Government',
      sections: [
        {
          heading: 'Structure of the U.S. Government',
          content: 'The federal government has three branches that share power. The legislative branch (Congress) makes laws. The executive branch (President) enforces them. The judicial branch (courts) interprets them. This separation prevents any one branch from becoming too strong.',
          keyFormulas: [
            'Congress = Senate (100 members, 6-year terms) + House (435 members, 2-year terms)',
            'President: elected every 4 years, max two terms (22nd Amendment)',
            'Supreme Court: 9 justices, appointed for life'
          ],
          tips: [
            'Remember LEJ in order: Laws made, Enforced, Judged.',
            'Bills become law only after passing BOTH chambers and being signed by the President (or overridden by 2/3 of Congress).'
          ]
        },
        {
          heading: 'Checks and Balances',
          content: 'Each branch can limit the powers of the others. The President vetoes laws; Congress overrides vetoes and confirms appointments; the Supreme Court declares laws unconstitutional (judicial review).',
          keyFormulas: [
            'Veto override: 2/3 vote in both House and Senate',
            'Treaty ratification: 2/3 of the Senate',
            'Impeachment: House charges, Senate tries'
          ],
          tips: [
            'Marbury v. Madison (1803) established judicial review — a frequent GED reference.',
            'Federalism = power split between national and state governments. Don’t confuse with checks and balances (within the national government).'
          ]
        },
        {
          heading: 'The Constitution and Bill of Rights',
          content: 'The Constitution is the supreme law of the United States. Its first ten amendments are the Bill of Rights, protecting individual freedoms from government overreach.',
          keyFormulas: [
            '1st Amendment: speech, press, religion, assembly, petition',
            '2nd: right to bear arms',
            '4th: protection from unreasonable search and seizure',
            '5th: due process, no self-incrimination',
            '13th–15th (Reconstruction): abolished slavery, equal protection, voting rights',
            '19th: women’s right to vote'
          ],
          tips: [
            'GED questions often pair an amendment number with a scenario — memorize the most common ones.',
            'When in doubt, the 1st Amendment is the answer for "free expression" scenarios.'
          ]
        },
        {
          heading: 'Civic Participation',
          content: 'Citizens exercise power by voting, running for office, serving on juries, paying taxes, and engaging in public debate. Voting rights have expanded over time through constitutional amendments and civil rights legislation.',
          keyFormulas: [
            'Voting Rights Act (1965): banned racial discrimination in voting',
            '26th Amendment (1971): lowered voting age to 18'
          ],
          tips: [
            'Distinguish rights (what government can’t take from you) from responsibilities (what citizens are expected to do).',
            'Watch for fact vs. opinion in political readings — facts are verifiable; opinions use words like "best", "should", "unfair".'
          ]
        }
      ]
    },

    'us-history': {
      title: 'U.S. History',
      sections: [
        {
          heading: 'Founding Era (1607–1789)',
          content: 'The American colonies were founded by Britain starting in 1607 (Jamestown). Conflicts over taxation and representation led to the Revolutionary War (1775–1783). The Declaration of Independence (1776) explained the break; the Constitution (1787) replaced the weaker Articles of Confederation.',
          keyFormulas: [
            'Declaration of Independence: 1776, principal author Thomas Jefferson',
            'Constitution ratified: 1788; took effect 1789',
            'Bill of Rights: 1791'
          ],
          tips: [
            '"No taxation without representation" was the colonists’ central grievance — appears constantly in GED passages.',
            'The Federalist Papers (Hamilton, Madison, Jay) argued FOR ratification of the Constitution.'
          ]
        },
        {
          heading: 'Civil War and Reconstruction (1861–1877)',
          content: 'Disputes over slavery and states’ rights led 11 Southern states to secede. The Union victory in 1865 preserved the country and ended slavery. Reconstruction tried — and largely failed — to integrate freed Black Americans into political life.',
          keyFormulas: [
            'Emancipation Proclamation: 1863',
            '13th Amendment: abolished slavery (1865)',
            '14th Amendment: equal protection (1868)',
            '15th Amendment: voting rights regardless of race (1870)'
          ],
          tips: [
            'Jim Crow laws followed Reconstruction and enforced segregation for nearly a century.',
            'Cause-and-effect questions love this era — practice tracing a single event (e.g., emancipation) to its long-term consequences.'
          ]
        },
        {
          heading: '20th Century: Wars and Reform',
          content: 'The U.S. emerged as a global power through two world wars. The Great Depression (1929–1939) led to the New Deal — a massive expansion of federal government. The Cold War (1945–1991) defined foreign policy for nearly five decades.',
          keyFormulas: [
            'WWI: 1914–1918 (U.S. entered 1917)',
            'Great Depression: began with 1929 stock market crash',
            'WWII: 1939–1945 (U.S. entered 1941 after Pearl Harbor)',
            'Cold War: ~1945–1991'
          ],
          tips: [
            'New Deal = government creates jobs and safety net (Social Security, FDIC). Frequently contrasted with laissez-faire economics.',
            'Cold War wasn’t a "hot" war between the U.S. and USSR — it was an arms race and proxy conflicts (Korea, Vietnam).'
          ]
        },
        {
          heading: 'Civil Rights Movement',
          content: 'A decades-long struggle to end racial segregation and secure equal rights for Black Americans. Combined legal challenges, nonviolent protest, and federal legislation.',
          keyFormulas: [
            'Brown v. Board of Education (1954): outlawed school segregation',
            'Civil Rights Act (1964): banned discrimination in public accommodations',
            'Voting Rights Act (1965): banned voting discrimination'
          ],
          tips: [
            'Martin Luther King Jr.’s "Letter from Birmingham Jail" and "I Have a Dream" speech are often-quoted passages.',
            'Distinguish de jure segregation (legal) from de facto segregation (in practice but not law).'
          ]
        }
      ]
    },

    'economics': {
      title: 'Economics',
      sections: [
        {
          heading: 'Supply and Demand',
          content: 'Demand is how much consumers want at each price; supply is how much producers offer. When they meet, you get the market price (equilibrium). Higher prices generally increase supply and decrease demand.',
          keyFormulas: [
            'Equilibrium: where supply curve meets demand curve',
            'If demand rises and supply is fixed → price goes up',
            'If supply rises and demand is fixed → price goes down'
          ],
          tips: [
            'Demand curves slope DOWN (people buy less when prices rise). Supply curves slope UP.',
            'A "shortage" means quantity demanded > quantity supplied at the current price.'
          ]
        },
        {
          heading: 'Scarcity and Opportunity Cost',
          content: 'Resources are limited but wants are unlimited — that’s scarcity. Every choice has an opportunity cost: the value of the next-best alternative you gave up.',
          keyFormulas: [
            'Opportunity cost = value of the best alternative not chosen'
          ],
          tips: [
            'Opportunity cost isn’t always money — it can be time, comfort, or another option.',
            'Scarcity is WHY economic choices exist. Every GED economics passage assumes it.'
          ]
        },
        {
          heading: 'Macroeconomic Indicators',
          content: 'A nation’s economy is measured by indicators that track total activity, prices, and employment. The Federal Reserve adjusts interest rates to keep these in balance.',
          keyFormulas: [
            'GDP: total value of all goods/services produced in a year',
            'Inflation: general rise in prices (CPI tracks it)',
            'Unemployment rate: % of workforce actively looking but jobless',
            'Recession: GDP shrinks for two consecutive quarters'
          ],
          tips: [
            'High inflation hurts savers; high unemployment hurts workers — the Fed targets BOTH.',
            'GDP per capita is a better measure of standard of living than total GDP.'
          ]
        },
        {
          heading: 'Personal Finance',
          content: 'Budgeting tracks income vs. expenses. Credit lets you borrow now and pay later — but interest compounds, so unpaid balances grow fast.',
          keyFormulas: [
            'Simple interest: I = P × r × t',
            'Compound interest: A = P(1 + r/n)^(nt)',
            'Net income = gross income − taxes/deductions'
          ],
          tips: [
            'Pay credit-card balances in full each month to avoid interest entirely.',
            'On the GED, "principal" means the original amount borrowed or invested — not the school administrator.'
          ]
        }
      ]
    },

    'geography': {
      title: 'Geography',
      sections: [
        {
          heading: 'Maps and Map Reading',
          content: 'A physical map shows landforms; a political map shows borders. Latitude lines run east–west (parallels); longitude lines run north–south (meridians). Scale tells you how map distance relates to real distance.',
          keyFormulas: [
            'Equator: 0° latitude',
            'Prime Meridian: 0° longitude (through Greenwich, England)',
            'Northern Hemisphere: above equator; Southern: below'
          ],
          tips: [
            'Lines of LATitude are LAYers stacked horizontally. Longitude lines run "long" pole to pole.',
            'Scale "1 inch = 100 miles" means every map inch is 100 real-world miles.'
          ]
        },
        {
          heading: 'Climate and Regions',
          content: 'Climate is the long-term weather pattern of a place, driven by latitude, elevation, ocean currents, and wind. Tropical regions near the equator are warm year-round; polar regions are cold; temperate zones have seasons.',
          keyFormulas: [
            'Tropics: between 23.5° N and 23.5° S',
            'Polar zones: above 66.5° N or below 66.5° S'
          ],
          tips: [
            'Higher elevation = colder climate, even at the equator (think Mount Kilimanjaro).',
            'Coastal areas tend to have milder temperatures than inland.'
          ]
        },
        {
          heading: 'Human Geography',
          content: 'How people interact with place: where they settle, how they migrate, how they reshape the land. Cities form where geography supports them (water, trade routes, resources).',
          keyFormulas: [
            'Push factors: things driving people OUT (war, famine, poverty)',
            'Pull factors: things drawing people IN (jobs, safety, family)',
            'Urbanization: movement from rural to urban areas'
          ],
          tips: [
            'Population density = people per square mile/km. Cities have high density; deserts low.',
            'The Columbian Exchange (1492 onward) reshaped global crops, diseases, and populations — frequent GED topic.'
          ]
        },
        {
          heading: 'Geography Shapes History',
          content: 'Rivers, mountains, and coastlines shape where civilizations grow and how they interact. Natural barriers slow conquest; trade routes accelerate cultural exchange.',
          keyFormulas: [
            'Ancient river civilizations: Nile (Egypt), Tigris-Euphrates (Mesopotamia), Indus (India), Yangtze (China)'
          ],
          tips: [
            'Resource maps (oil, coal, farmland) often explain economic and political patterns — check the legend.',
            'When a passage gives you a map AND text, the answer usually requires combining both.'
          ]
        }
      ]
    },

    'world-history': {
      title: 'World History',
      sections: [
        {
          heading: 'Ancient Civilizations',
          content: 'The first complex societies emerged in river valleys around 3500 BCE. They developed writing, organized religion, formal government, and large-scale agriculture.',
          keyFormulas: [
            'Mesopotamia (modern Iraq): cuneiform writing, Code of Hammurabi',
            'Egypt: hieroglyphics, pyramids, pharaohs',
            'Greece (~500 BCE): democracy in Athens, philosophy (Socrates, Plato, Aristotle)',
            'Rome: republic → empire; legal system shaped Western law'
          ],
          tips: [
            'BCE = "Before Common Era" (= BC). CE = "Common Era" (= AD). Larger BCE numbers are EARLIER in time.',
            'Greek democracy was direct (citizens voted on laws); the U.S. is a republic (citizens elect representatives).'
          ]
        },
        {
          heading: 'Medieval and Renaissance Europe',
          content: 'After Rome fell (~476 CE), Europe broke into feudal kingdoms. The Catholic Church dominated. The Renaissance (1300s–1600s) revived classical learning, art, and science — preparing the ground for global exploration.',
          keyFormulas: [
            'Feudalism: lords grant land to vassals in exchange for service',
            'Black Death (1347–1351): killed about a third of Europe',
            'Renaissance figures: Leonardo da Vinci, Michelangelo, Galileo'
          ],
          tips: [
            'The Protestant Reformation (Martin Luther, 1517) split Western Christianity and reshaped European politics.',
            'The printing press (Gutenberg, ~1440) was the era’s biggest information revolution.'
          ]
        },
        {
          heading: 'Exploration and Colonization',
          content: 'European powers sailed worldwide starting in the 1400s, seeking trade routes, gold, and converts. The result was vast colonial empires — and devastation for indigenous populations.',
          keyFormulas: [
            'Columbus reaches the Americas: 1492',
            'Spanish, Portuguese, French, British, and Dutch empires dominate 1500s–1800s',
            'Triangle Trade: Africa → Americas (enslaved people) → Europe (raw goods) → Africa (manufactured goods)'
          ],
          tips: [
            'The Columbian Exchange transferred crops (potatoes, corn) and diseases (smallpox) in both directions.',
            'Most of Latin America declared independence in the early 1800s, inspired by the American and French revolutions.'
          ]
        },
        {
          heading: 'Modern Era',
          content: 'The Industrial Revolution (late 1700s onward) transformed work, cities, and class structure. The 20th century brought two world wars, decolonization across Africa and Asia, and the Cold War’s ideological split.',
          keyFormulas: [
            'Industrial Revolution: began in Britain, ~1760',
            'WWI: 1914–1918; WWII: 1939–1945',
            'Decolonization: most African and Asian colonies gain independence 1945–1975',
            'Soviet Union collapses: 1991'
          ],
          tips: [
            'Globalization accelerated AFTER 1991, with the end of the Cold War and rise of the internet.',
            'Compare world events to U.S. history: e.g., U.S. industrialization (late 1800s) lagged Britain by roughly a century.'
          ]
        }
      ]
    }
  }
};

// English (RLA) — pulled from the official GED Reasoning Through Language Arts guide.
STATIC_NOTES['english'] = {
  'reading-comprehension': {
    title: 'Reading Comprehension',
    sections: [
      {
        heading: 'Main Ideas and Supporting Details',
        content: 'The main idea is the central point the author wants you to take away. Supporting details are the facts, examples, and reasoning that prove it. The main idea is usually stated near the beginning or end of a paragraph or passage — but sometimes it must be inferred from what the details add up to.',
        keyFormulas: [],
        tips: [
          'A title or first sentence often hints at the main idea, but don\'t lock in until you\'ve read the whole passage.',
          'Test a candidate main idea by asking, "Do most of the details in this passage support this?"'
        ]
      },
      {
        heading: 'Drawing Inferences',
        content: 'An inference is a conclusion the author implies but doesn\'t state outright. You build inferences by combining what the text says with reasonable real-world knowledge. Stay close to the evidence — GED inferences are never wild guesses.',
        keyFormulas: [],
        tips: [
          'If an answer requires information that\'s not in the passage at all, it\'s not a valid inference.',
          'Watch for tone words ("reluctantly", "smirked") — they often reveal what a character or author is implying.'
        ]
      },
      {
        heading: 'Summarizing',
        content: 'A good summary captures the main idea plus the key supporting points, in your own words. It leaves out examples, asides, and personal opinions. On the GED, the correct summary is the one that covers the WHOLE passage — not just the opening or a single paragraph.',
        keyFormulas: [],
        tips: [
          'Eliminate any answer that focuses on only one detail or paragraph.',
          'Eliminate answers that introduce information the passage didn\'t mention.'
        ]
      },
      {
        heading: 'Comparing Across Texts',
        content: 'When two passages appear together, the GED usually asks how they agree, disagree, or treat the same topic differently. Note each author\'s claim and tone separately, then look for the relationship between them.',
        keyFormulas: [],
        tips: [
          'Two passages on the same topic can both be correct — they may just emphasize different angles.',
          'A "compare" answer that only describes ONE of the two passages is almost always wrong.'
        ]
      }
    ]
  },
  'grammar-and-usage': {
    title: 'Grammar & Usage',
    sections: [
      {
        heading: 'Subject–Verb Agreement',
        content: 'A verb must agree with its subject in number. Singular subjects take singular verbs; plural subjects take plural verbs. The trick is identifying the real subject when words come between the subject and the verb.',
        keyFormulas: [
          'The boy runs.   |   The boys run.',
          'The box of cookies IS on the table.   (subject: box, not cookies)'
        ],
        tips: [
          'Cross out prepositional phrases ("of cookies", "with my friends") to find the true subject.',
          'Compound subjects joined by "and" usually take a plural verb.'
        ]
      },
      {
        heading: 'Pronouns and Antecedents',
        content: 'A pronoun must clearly refer to a single, specific antecedent — and it must match that antecedent in number and gender. Vague pronouns ("This is important") are a common GED trap.',
        keyFormulas: [
          'Each student must bring HIS OR HER textbook.   (each = singular)',
          'The team celebrated ITS victory.   (team = singular collective)'
        ],
        tips: [
          'If a sentence starts with "It" or "This", ask: "It/this what?" If you can\'t answer in one word, the reference is unclear.',
          '"Each", "every", "anyone", "everyone" are singular.'
        ]
      },
      {
        heading: 'Punctuation',
        content: 'Commas separate items in a list, set off introductory phrases, and join independent clauses with a coordinating conjunction (FANBOYS). Semicolons join two independent clauses without a conjunction. Apostrophes show possession or contraction — never plurals.',
        keyFormulas: [
          'Comma + FANBOYS joins clauses: "I studied, AND I passed."',
          'Semicolon joins clauses directly: "I studied; I passed."',
          'It\'s = it is.   Its = belongs to it.'
        ],
        tips: [
          'Never use a comma alone between two complete sentences — that\'s a comma splice.',
          'No apostrophe is needed to pluralize: "the 1990s" not "the 1990\'s".'
        ]
      },
      {
        heading: 'Parallel Structure',
        content: 'Items in a list or comparison should share the same grammatical form. Mixing forms (e.g., a noun, a verb, a phrase) sounds off and is consistently wrong on the GED.',
        keyFormulas: [
          'Parallel: "running, jumping, and swimming"',
          'Not parallel: "running, to jump, and swam"'
        ],
        tips: [
          'When you see a list, check that every item starts the same way (all -ing, all to-verbs, all nouns, etc.).',
          'Comparisons with "than" or "as" must compare like things: "her car is faster than HIS" (not "than him").'
        ]
      }
    ]
  },
  'vocabulary-in-context': {
    title: 'Vocabulary in Context',
    sections: [
      {
        heading: 'Context Clues',
        content: 'You can usually figure out an unfamiliar word from how it\'s used in the sentence around it. Look for definitions, synonyms, antonyms, examples, and tone signals nearby.',
        keyFormulas: [
          'Definition clue: "Photosynthesis, the process plants use to convert light into energy, ..."',
          'Contrast clue: "She was usually GREGARIOUS, but tonight she sat quietly."'
        ],
        tips: [
          'Pay attention to words like "but", "however", "unlike" — they signal a contrast clue.',
          'Try plugging your guess back in. If the sentence still makes sense, you\'ve probably got it.'
        ]
      },
      {
        heading: 'Connotation vs. Denotation',
        content: 'Denotation is a word\'s dictionary meaning. Connotation is its emotional flavor. "Cheap" and "inexpensive" share a denotation but feel different — one is negative, the other neutral.',
        keyFormulas: [],
        tips: [
          'When two answer choices share a literal meaning, the right one usually matches the passage\'s tone.',
          'Authors choose connotation deliberately — it\'s a clue to their attitude.'
        ]
      },
      {
        heading: 'Figurative Language',
        content: 'Figurative language uses words in non-literal ways for emphasis or imagery. A simile compares with "like" or "as"; a metaphor compares directly; an idiom is a phrase whose meaning isn\'t literal ("kick the bucket" = die).',
        keyFormulas: [],
        tips: [
          'If a literal reading of a phrase makes no sense ("the news hit like a truck"), it\'s figurative.',
          'Don\'t pick an answer that interprets figurative language literally.'
        ]
      },
      {
        heading: 'Word Choice and Tone',
        content: 'Authors pick words to set a mood — formal, casual, urgent, mocking, admiring. Tone questions ask which adjective best captures the author\'s attitude toward the subject.',
        keyFormulas: [],
        tips: [
          'Underline emotional or evaluative words ("absurd", "celebrated", "tragic") — they carry the tone.',
          'Eliminate tone choices that are too strong ("furious") when the passage is just mildly negative.'
        ]
      }
    ]
  },
  'analyzing-arguments': {
    title: 'Analyzing Arguments',
    sections: [
      {
        heading: 'Claims and Theses',
        content: 'A claim (or thesis) is the central point an author argues for. Everything else in the passage either supports or qualifies it. The claim is often stated early and restated at the end.',
        keyFormulas: [],
        tips: [
          'Distinguish the claim ("we should") from supporting facts ("data shows").',
          'A title can be a claim — pay attention to it.'
        ]
      },
      {
        heading: 'Evidence and Reasoning',
        content: 'Evidence is the facts, examples, and quotations the author uses to back up a claim. Reasoning is how those facts logically lead to the conclusion. Strong arguments use relevant, specific, and well-reasoned evidence.',
        keyFormulas: [],
        tips: [
          'Ask whether the evidence directly supports the claim, or just sounds impressive.',
          'A single anecdote rarely proves a general claim.'
        ]
      },
      {
        heading: 'Bias and Fallacies',
        content: 'Bias is an unfair lean toward one side. Common fallacies include attacking the person instead of the argument (ad hominem), claiming everyone believes it (bandwagon), or jumping from one event to a wild consequence (slippery slope).',
        keyFormulas: [],
        tips: [
          'Loaded words ("greedy", "heroic") are bias indicators.',
          'Watch for "all", "always", "never" — sweeping claims are often unsupported.'
        ]
      },
      {
        heading: 'Comparing Competing Arguments',
        content: 'When the GED shows two opposing arguments, the question is usually about WHERE they disagree and WHO has stronger support. Both authors can make valid points; only one might back theirs up better.',
        keyFormulas: [],
        tips: [
          'Map each author\'s core claim and main evidence in a sentence before answering.',
          'A "stronger argument" is one with better evidence, not just a louder claim.'
        ]
      }
    ]
  },
  'writing-and-essay': {
    title: 'Writing & Essay',
    sections: [
      {
        heading: 'Essay Structure',
        content: 'A GED extended-response essay has three parts: introduction (state your thesis), body (2–3 paragraphs, each with one main point + evidence), and conclusion (restate the thesis and tie it together). Each paragraph should do ONE job.',
        keyFormulas: [
          'Intro → Body ¶1 → Body ¶2 → Body ¶3 → Conclusion'
        ],
        tips: [
          'Outline before you write — even 30 seconds of bullets prevents wandering paragraphs.',
          'Save 5 minutes at the end for editing.'
        ]
      },
      {
        heading: 'Thesis Statement',
        content: 'A thesis is one sentence that states your position AND previews how you\'ll defend it. It belongs at the end of your introduction. Vague theses ("This is an important topic") sink your score; specific ones lift it.',
        keyFormulas: [
          'Weak: "Schools are important."',
          'Strong: "Schools improve communities by raising literacy, expanding job options, and lowering crime."'
        ],
        tips: [
          'Try the "because" test: "X is true because A, B, and C." If you can fill that in, you have a thesis.',
          'Mirror the wording of the prompt — it shows the grader you read it.'
        ]
      },
      {
        heading: 'Using Textual Evidence',
        content: 'When the prompt gives you source passages, quote or paraphrase specific lines to back up each body paragraph\'s point. Don\'t just summarize the sources — engage with their arguments.',
        keyFormulas: [],
        tips: [
          'Introduce a quote with context: "The author argues that X, citing ..."',
          'Always explain WHY the quote supports your point — don\'t leave it standalone.'
        ]
      },
      {
        heading: 'Editing for Clarity',
        content: 'The last few minutes are for fixing — not rewriting. Check for run-on sentences, subject–verb agreement, missing commas, and unclear pronouns. Trim wordy phrases.',
        keyFormulas: [
          '"In order to" → "to"',
          '"Due to the fact that" → "because"'
        ],
        tips: [
          'Read your essay one sentence at a time, backwards from the end — it forces you to notice grammar instead of meaning.',
          'Cut any sentence that doesn\'t move your argument forward.'
        ]
      }
    ]
  }
};

// Science — pulled from the official GED Science study guide.
STATIC_NOTES['science'] = {
  'life-science': {
    title: 'Life Science',
    sections: [
      {
        heading: 'Cells',
        content: 'All living things are made of cells. Cells contain organelles — small structures with specific jobs. Plant and animal cells share most organelles; only plant cells have a cell wall, chloroplasts, and a large central vacuole.',
        keyFormulas: [
          'Nucleus: stores DNA',
          'Mitochondria: produce energy (ATP) — "powerhouse of the cell"',
          'Ribosomes: build proteins',
          'Chloroplasts (plants only): perform photosynthesis'
        ],
        tips: [
          'If a question mentions chloroplasts or a cell wall, it\'s about a plant cell.',
          'Cells reproduce by mitosis (regular growth) or meiosis (forming egg/sperm).'
        ]
      },
      {
        heading: 'Genetics',
        content: 'Genes are segments of DNA that code for traits. Each parent passes one copy of every gene to their offspring. Dominant alleles mask recessive ones — so a "Bb" person shows the dominant trait but can pass on the recessive one.',
        keyFormulas: [
          'Punnett squares predict offspring trait ratios.',
          'Dominant allele (B) masks recessive (b). bb only when BOTH parents pass on b.'
        ],
        tips: [
          'Capital letter = dominant, lowercase = recessive.',
          'Hetero- = different alleles (Bb); homo- = same (BB or bb).'
        ]
      },
      {
        heading: 'Evolution',
        content: 'Evolution is the change in a population\'s traits over generations. Natural selection drives it: individuals with traits better suited to their environment survive and reproduce more, passing those traits on. Over time, the population shifts.',
        keyFormulas: [],
        tips: [
          'Evolution acts on POPULATIONS, not individuals — a single organism can\'t evolve.',
          'Don\'t confuse evolution with "trying" — giraffes didn\'t stretch their necks; long-necked individuals just survived better.'
        ]
      },
      {
        heading: 'Ecosystems',
        content: 'An ecosystem is the living things (biotic) and physical environment (abiotic) of an area, interacting. Energy flows ONE way (sun → plants → herbivores → carnivores). Matter cycles (water, carbon, nitrogen) repeatedly.',
        keyFormulas: [
          'Producers (plants) → Primary consumers (herbivores) → Secondary consumers (carnivores)',
          'Each step up the chain only ~10% of energy transfers'
        ],
        tips: [
          'Decomposers (fungi, bacteria) recycle dead matter — they belong in every food web.',
          'Remove a species and the WHOLE web shifts.'
        ]
      },
      {
        heading: 'Human Body Systems',
        content: 'The major systems work together to keep the body running. Circulatory moves blood; respiratory exchanges gases; digestive breaks down food; nervous controls signaling; skeletal/muscular support and move the body.',
        keyFormulas: [],
        tips: [
          'Most GED questions on body systems are about how two systems INTERACT (e.g., respiratory + circulatory deliver oxygen to cells).',
          'Homeostasis = the body keeping conditions stable (temperature, pH, sugar levels).'
        ]
      }
    ]
  },
  'physical-science': {
    title: 'Physical Science',
    sections: [
      {
        heading: 'States of Matter',
        content: 'Matter exists as solid, liquid, gas, or plasma. The difference is how much its particles move. Heating adds energy and moves matter "up" the chain; cooling does the opposite.',
        keyFormulas: [
          'Solid → liquid: melting',
          'Liquid → gas: vaporization / boiling',
          'Gas → liquid: condensation',
          'Liquid → solid: freezing'
        ],
        tips: [
          'Phase changes do NOT change what the substance is — water is H₂O whether ice, liquid, or steam.',
          'During a phase change, temperature stays constant even though heat is being added or removed.'
        ]
      },
      {
        heading: 'Atoms and the Periodic Table',
        content: 'An atom has a nucleus of protons (+) and neutrons (neutral), surrounded by electrons (–). The number of protons = the atomic number, which defines the element. The periodic table groups elements by similar properties.',
        keyFormulas: [
          'Atomic number = number of protons',
          'Mass number = protons + neutrons',
          'Neutral atom: protons = electrons'
        ],
        tips: [
          'Columns (groups) share chemical behavior; rows (periods) share electron shell count.',
          'Group 1 = highly reactive metals; Group 18 = inert noble gases.'
        ]
      },
      {
        heading: 'Chemical Reactions',
        content: 'In a chemical reaction, atoms rearrange to form new substances. Mass is conserved — the same atoms appear on both sides of the equation. Balancing means adjusting coefficients until every element has the same count on each side.',
        keyFormulas: [
          '2H₂ + O₂ → 2H₂O   (mass and atoms balanced)',
          'Types: synthesis (A + B → AB), decomposition (AB → A + B), single replacement, double replacement, combustion'
        ],
        tips: [
          'Never change subscripts to balance — only coefficients.',
          'A balanced equation has the same number of EACH element on left and right.'
        ]
      },
      {
        heading: 'Forces and Motion',
        content: 'A force is a push or pull. Newton\'s three laws describe how forces affect motion: 1) Objects keep doing what they\'re doing unless a force acts. 2) F = ma. 3) Every action has an equal, opposite reaction.',
        keyFormulas: [
          'Newton\'s 2nd law: F = m × a',
          'Speed = distance / time;   Acceleration = Δvelocity / time',
          'Weight (on Earth) = mass × 9.8 m/s²'
        ],
        tips: [
          'Mass is constant everywhere; weight depends on gravity.',
          'A balanced set of forces produces NO acceleration — but the object can still be moving.'
        ]
      },
      {
        heading: 'Energy',
        content: 'Energy is the ability to do work. It comes in many forms — kinetic (motion), potential (stored), thermal (heat), chemical, electrical, light. Energy is conserved: it changes form but is never created or destroyed.',
        keyFormulas: [
          'KE = ½ m v²   (kinetic energy)',
          'PE = m g h    (gravitational potential energy)'
        ],
        tips: [
          'A roller coaster swaps KE and PE — the totals stay (nearly) constant ignoring friction.',
          'Heat ALWAYS flows from hot to cold, never the reverse on its own.'
        ]
      }
    ]
  },
  'earth-space-science': {
    title: 'Earth & Space Science',
    sections: [
      {
        heading: 'Earth\'s Structure',
        content: 'Earth has four main layers: the solid inner core, liquid outer core, mantle (mostly solid but slowly flowing), and the thin rocky crust we live on.',
        keyFormulas: [
          'Crust (thin, solid) → Mantle (semi-solid) → Outer core (liquid) → Inner core (solid)'
        ],
        tips: [
          'The crust is thinner under oceans, thicker under continents.',
          'Heat from the core drives mantle convection — which drives plate tectonics.'
        ]
      },
      {
        heading: 'Plate Tectonics',
        content: 'The crust is broken into plates that float on the mantle and move slowly. Where plates meet, you get earthquakes, volcanoes, and mountain ranges, depending on whether plates collide, pull apart, or grind past each other.',
        keyFormulas: [
          'Convergent: plates collide → mountains, volcanoes, subduction',
          'Divergent: plates pull apart → mid-ocean ridges, rift valleys',
          'Transform: plates slide → earthquakes (e.g., San Andreas Fault)'
        ],
        tips: [
          'Most earthquakes happen at plate boundaries.',
          'The "Ring of Fire" around the Pacific Ocean is a chain of convergent boundaries — that\'s why it has so many volcanoes.'
        ]
      },
      {
        heading: 'Water Cycle and Weather',
        content: 'Water continuously cycles: evaporation from oceans/lakes → condensation into clouds → precipitation (rain/snow) → runoff back to oceans. Weather is short-term atmospheric conditions; climate is the long-term pattern.',
        keyFormulas: [
          'Evaporation → Condensation → Precipitation → Runoff → (repeat)'
        ],
        tips: [
          'Warm air holds more moisture than cold air — that\'s why humid summers and dry winters.',
          'Fronts (warm vs. cold air masses meeting) drive most weather changes.'
        ]
      },
      {
        heading: 'Climate Change',
        content: 'Climate is the long-term average of weather. Greenhouse gases (CO₂, methane, water vapor) trap heat in the atmosphere — a natural process humans have accelerated by burning fossil fuels. Effects include rising temperatures, melting ice, and rising sea levels.',
        keyFormulas: [],
        tips: [
          'Don\'t confuse weather and climate — a cold winter doesn\'t disprove climate change.',
          'The scientific consensus that humans are driving recent climate change is overwhelming.'
        ]
      },
      {
        heading: 'The Solar System and Universe',
        content: 'The solar system: a star (the Sun) plus 8 planets, their moons, dwarf planets, asteroids, and comets. The Sun, like all stars, fuses hydrogen into helium and releases enormous energy. Beyond it lie billions of other stars in our galaxy (the Milky Way), and billions of other galaxies in the universe.',
        keyFormulas: [
          'Inner (rocky) planets: Mercury, Venus, Earth, Mars',
          'Outer (gas/ice giants): Jupiter, Saturn, Uranus, Neptune'
        ],
        tips: [
          'Earth\'s tilt — not its distance from the sun — causes seasons.',
          'A light-year is a distance, not a time: how far light travels in one year (~9.5 trillion km).'
        ]
      }
    ]
  },
  'scientific-method': {
    title: 'Scientific Method',
    sections: [
      {
        heading: 'Forming a Hypothesis',
        content: 'A hypothesis is a specific, testable prediction. "If X, then Y" is the classic form. Good hypotheses can be DISPROVED by an experiment — vague ones ("nature is balanced") can\'t and aren\'t scientific.',
        keyFormulas: [
          'Hypothesis form: "If [change], then [predicted result]."'
        ],
        tips: [
          'A hypothesis isn\'t a guess — it\'s an informed prediction based on prior knowledge.',
          'On the GED, the best hypothesis is the most specific one that the proposed experiment could actually test.'
        ]
      },
      {
        heading: 'Variables',
        content: 'In every experiment there\'s an independent variable (what you change), a dependent variable (what you measure), and controlled variables (kept the same). Confusing these is the #1 way GED experimental-design questions go wrong.',
        keyFormulas: [
          'Independent: what you change (e.g., amount of water)',
          'Dependent: what you measure (e.g., plant height)',
          'Controlled: what you keep the same (light, soil, temperature)'
        ],
        tips: [
          'The dependent variable "depends on" the independent variable.',
          'If TWO things change between groups, you can\'t tell which one caused the difference.'
        ]
      },
      {
        heading: 'Experimental Design and Controls',
        content: 'A control group receives no treatment (or a fake one) and serves as a baseline. The experimental group gets the actual treatment. Comparing them isolates the effect of the variable being tested.',
        keyFormulas: [],
        tips: [
          'Random assignment + large sample size = stronger results.',
          'If there\'s no control group, the experiment can\'t prove what caused the result.'
        ]
      },
      {
        heading: 'Drawing Conclusions',
        content: 'A conclusion summarizes what the data show and whether they support the hypothesis. Stay within what the data actually demonstrate — don\'t generalize beyond your sample, and don\'t claim causation when you only have correlation.',
        keyFormulas: [],
        tips: [
          'Single experiment = preliminary result, NOT proof.',
          'A failed hypothesis is not a failed experiment — disproving an idea is still useful.'
        ]
      }
    ]
  },
  'data-interpretation': {
    title: 'Scientific Data',
    sections: [
      {
        heading: 'Reading Tables and Graphs',
        content: 'Line graphs show change over time. Bar graphs compare categories. Scatter plots show relationships between two variables. Always read the title, axis labels, and units before answering.',
        keyFormulas: [],
        tips: [
          'On a scatter plot, look for an overall trend — points going up, down, or scattered.',
          'Watch the y-axis scale — graphs often exaggerate trends by starting above zero.'
        ]
      },
      {
        heading: 'Trends and Outliers',
        content: 'A trend is the overall pattern. An outlier is a data point far from the rest. Outliers can be real (interesting!) or errors (toss them after investigation), but they should never be ignored without comment.',
        keyFormulas: [],
        tips: [
          'A single outlier rarely changes the overall trend.',
          'Trend descriptions: "increasing", "decreasing", "no change", "fluctuates".'
        ]
      },
      {
        heading: 'Correlation vs. Causation',
        content: 'Correlation means two variables move together. Causation means one CAUSES the other. Ice-cream sales and shark attacks rise together — both are driven by summer, not by each other. Establishing causation requires a controlled experiment.',
        keyFormulas: [],
        tips: [
          'If a study only OBSERVES without controlling variables, it can show correlation but not causation.',
          'Look for the "lurking variable" — the hidden factor driving both observed variables.'
        ]
      },
      {
        heading: 'Calculations from Data',
        content: 'Common GED data calculations: mean (sum ÷ count), percent change ((new−old)/old × 100), and rates (units per unit, like mph or m/s²). Use only the numbers the question gives you.',
        keyFormulas: [
          'Mean = sum ÷ count',
          'Percent change = (new − old) / old × 100',
          'Rate = quantity ÷ time'
        ],
        tips: [
          'Estimate first — if your calculated answer is wildly different, you probably mis-keyed.',
          'Always include units in your answer.'
        ]
      }
    ]
  }
};

export function getStaticNotes(subject, slug) {
  return STATIC_NOTES[subject]?.[slug] || null;
}
