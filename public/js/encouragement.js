// Curated encouragement messages for the dashboard, results screen, etc.
// Each message can include {name}, which gets replaced with the user's first
// name when one is available. If the name is missing, the placeholder (and
// any leading/trailing comma+space punctuation around it) is removed cleanly.

const MESSAGES = [
  // Effort & consistency
  "Consistency is key — you've got this, {name}!",
  "Showing up is half the battle, {name}. You're already winning.",
  "Every problem you tackle builds your math muscle, {name}.",
  "Small steps every day, big results by exam day.",
  "You're putting in the work, {name}. Keep at it.",

  // Skill building
  "You're building great problem-solving skills!",
  "Your reasoning is getting sharper with every session.",
  "Each question is a chance to learn — even the tricky ones.",
  "Mistakes are how the math sticks. Don't fear them.",
  "Think like a mathematician, {name} — slow, careful, curious.",

  // Confidence
  "You're capable of more than you think, {name}.",
  "Math rewards patience. You've got plenty of that.",
  "Your future self will thank you for studying today.",
  "One topic at a time. You're closer than you were yesterday.",
  "Adults who go back to study math? That takes guts. Proud of you, {name}.",

  // Practice-focused
  "Practice doesn't make perfect — it makes permanent. Keep going.",
  "The GED test is just a series of problems you've already practiced.",
  "You don't have to be fast. You just have to be right.",
  "Every wrong answer is just feedback. Use it.",
  "Strong fundamentals beat fancy tricks every time."
];

/**
 * Pick a random encouragement message, optionally interpolating a first name.
 * @param {string=} firstName
 * @returns {string}
 */
export function randomEncouragement(firstName) {
  const raw = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  return interpolateName(raw, firstName);
}

function interpolateName(template, firstName) {
  const name = (firstName || '').trim();
  if (name) return template.replace(/\{name\}/g, name);
  // No name available — strip "{name}" along with surrounding punctuation
  // so we don't leave dangling commas like "You've got this, !"
  return template
    .replace(/,\s*\{name\}/g, '')   // ", {name}" → ""
    .replace(/\{name\},?\s*/g, '')  // "{name}, " or "{name}" → ""
    .trim();
}
