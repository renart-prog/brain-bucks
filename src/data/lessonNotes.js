// Original "New Concept" teaching notes shown before each day's test —
// written to introduce the same skill as the matching Saxon Math Course 2
// lesson (Hake), not copied from the textbook.

export const LESSON_NOTES = {
  1: {
    title: 'Arithmetic with Whole Numbers & Money; Variables & Evaluation',
    tip: {
      label: 'Reading Math',
      text: 'Never mix a dollar sign and a cent sign on the same amount — write either $0.50 or 50¢, never $0.50¢.',
    },
    intro: [
      'The four fundamental operations of arithmetic each have their own vocabulary: addend + addend = sum, minuend − subtrahend = difference, factor × factor = product, and dividend ÷ divisor = quotient.',
      'Amounts of money can be written with a dollar sign ($) or a cent sign (¢) — but never both at once. Fifty cents can be written as $0.50 or as 50¢, and both mean the same thing.',
      'A variable is a letter that stands in for a number that can change. To evaluate an expression, substitute a number for each variable and then calculate.',
    ],
    terms: [
      { term: 'Sum / Difference', def: 'the results of addition and subtraction' },
      { term: 'Product / Quotient', def: 'the results of multiplication and division' },
      { term: 'Variable', def: 'a letter that represents a number that can change, like x or y' },
      { term: 'Evaluate', def: 'to find the value of an expression by substituting numbers for its variables' },
    ],
    mistake: {
      label: 'Watch Out!',
      badExample: 'Erasers — .25¢ each',
      reason: 'This sign mixes a cent sign with a decimal-style price. Since ¢ already means "cents," it should simply read 25¢ (or $0.25) — never both styles at once.',
    },
    example: {
      prompt: 'Evaluate x + y for x = 10 and y = 5.',
      solution: 'Substitute the values: 10 + 5 = 15.',
    },
  },
  2: {
    title: 'Properties of Operations',
    tip: {
      label: 'Math Language',
      text: 'Commutative = order can swap. Associative = grouping can change. Neither applies to subtraction or division.',
    },
    intro: [
      'The Commutative Property says you can swap the order of two addends or two factors without changing the sum or product. The Associative Property says you can regroup addends or factors without changing the result.',
      'The Identity Property says adding 0 or multiplying by 1 leaves a number unchanged. The Property of Zero says multiplying any number by 0 always gives 0.',
    ],
    terms: [
      { term: 'Commutative Property', def: 'a + b = b + a, or a × b = b × a' },
      { term: 'Associative Property', def: '(a + b) + c = a + (b + c), or the same for multiplication' },
      { term: 'Identity Property', def: 'a + 0 = a, and a × 1 = a' },
      { term: 'Property of Zero', def: 'a × 0 = 0' },
    ],
    example: {
      prompt: 'Which property is shown? (3 + 4) + 5 = 3 + (4 + 5)',
      solution: 'The addends are regrouped, not reordered, so this is the Associative Property of Addition.',
    },
  },
  3: {
    title: 'Unknown Numbers in Addition, Subtraction, Multiplication & Division',
    tip: {
      label: 'Problem Solving',
      text: 'To undo addition, subtract. To undo multiplication, divide. Always use the inverse operation to isolate the unknown.',
    },
    intro: [
      'When one number in an addition or subtraction fact is unknown, use the inverse operation with the two known numbers to find it. The same idea works for multiplication and division.',
      'For example, if n + 8 = 23, subtract the known addend from the sum: n = 23 − 8 = 15.',
    ],
    terms: [
      { term: 'Unknown addend', def: 'found by subtracting the known addend from the sum' },
      { term: 'Unknown factor', def: 'found by dividing the product by the known factor' },
      { term: 'Inverse operation', def: 'the operation that undoes another, like subtraction undoing addition' },
    ],
    example: {
      prompt: 'Find n: 6n = 54',
      solution: 'Divide the product by the known factor: 54 ÷ 6 = 9, so n = 9.',
    },
  },
  4: {
    title: 'Number Line & Sequences',
    tip: {
      label: 'Reading Math',
      text: 'To extend a sequence, first find its rule — the amount added, subtracted, or multiplied to get from one term to the next.',
    },
    intro: [
      'A sequence is a list of numbers arranged according to a rule. Finding that rule (also called finding the pattern) lets you predict any term, not just the next one.',
      'On a number line, moving right means the value increases; moving left means it decreases — this works the same way with negative numbers as with positive ones.',
    ],
    terms: [
      { term: 'Sequence', def: 'a list of terms arranged according to a rule' },
      { term: 'Term', def: 'one number in a sequence' },
      { term: 'Common difference', def: 'the fixed amount added (or subtracted) to get from one term to the next' },
    ],
    example: {
      prompt: 'What is the next term? 4, 9, 14, 19, ___',
      solution: 'Each term increases by 5, so the next term is 19 + 5 = 24.',
    },
  },
  5: {
    title: 'Place Value & Reading/Writing Whole Numbers',
    tip: {
      label: 'Math Language',
      text: 'Every group of three digits (a "period") has its own name — ones, thousands, millions, billions, trillions — read from left to right.',
    },
    intro: [
      'Each digit in a whole number has a place value based on its position. Moving one place to the left multiplies the value of a digit by 10.',
      'To read a large number, break it into groups of three digits from the right, then read each group followed by its period name (thousand, million, and so on).',
    ],
    terms: [
      { term: 'Place value', def: "the value of a digit based on its position in a number" },
      { term: 'Standard form', def: 'a number written with digits, like 40,507' },
      { term: 'Rounding', def: 'replacing a number with a simpler nearby value' },
    ],
    example: {
      prompt: 'What is the value of the digit 6 in 6,204,000?',
      solution: 'The 6 is in the millions place, so its value is 6,000,000.',
    },
  },
  6: {
    title: 'Factors & Divisibility',
    tip: {
      label: 'Reading Math',
      text: 'Quick divisibility checks: even last digit → divisible by 2. Ends in 0 or 5 → divisible by 5. Digits sum to a multiple of 3 → divisible by 3.',
    },
    intro: [
      'A factor of a number divides into it evenly, with no remainder. Every whole number greater than 0 has at least two factors: 1 and itself.',
      'Divisibility rules let you check whether one number divides evenly into another without actually doing the division.',
    ],
    terms: [
      { term: 'Factor', def: 'a number that divides evenly into another number' },
      { term: 'Divisible', def: 'able to be divided evenly, with no remainder' },
      { term: 'Greatest common factor', def: 'the largest factor shared by two or more numbers' },
    ],
    example: {
      prompt: 'Is 42 divisible by 3?',
      solution: 'The digits of 42 add to 4 + 2 = 6, and 6 is a multiple of 3, so yes — 42 is divisible by 3.',
    },
  },
  7: {
    title: 'Lines, Angles & Planes',
    tip: {
      label: 'Math Language',
      text: 'Acute < 90° < Right (exactly 90°) < Obtuse < 180° (straight).',
    },
    intro: [
      'A plane is a flat surface that extends forever in every direction. A line extends forever in two directions; a ray extends forever in just one direction from an endpoint; a line segment has two endpoints.',
      'Angles are classified by their measure: acute (less than 90°), right (exactly 90°), obtuse (between 90° and 180°), and straight (exactly 180°).',
    ],
    terms: [
      { term: 'Plane', def: 'a flat surface extending forever in every direction' },
      { term: 'Ray', def: 'part of a line with one endpoint, extending forever in one direction' },
      { term: 'Parallel lines', def: 'lines that never intersect and stay the same distance apart' },
      { term: 'Perpendicular lines', def: 'lines that intersect at a right angle (90°)' },
    ],
    example: {
      prompt: 'Classify an angle that measures 120°.',
      solution: 'Since 120° is more than 90° but less than 180°, it is an obtuse angle.',
    },
  },
}
