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

export function getStaticNotes(subject, slug) {
  return STATIC_NOTES[subject]?.[slug] || null;
}
