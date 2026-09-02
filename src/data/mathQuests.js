// Original bonus logic puzzle for the "Math Quest" feature. Bold spans in
// clue text are marked with **like this** and rendered by MathQuest.jsx.
export const MATH_QUESTS = [
  {
    id: 1,
    title: 'The Mystery Cipher',
    type: 'Logic Puzzle',
    goal: 'Decode the secret 3-digit code to open the vault!',
    clues: [
      '6 × 8 = ___. The last digit of this answer is the **first digit** of the code.',
      'The **middle digit** is half of the first digit.',
      'All three digits **add up to 15**.',
    ],
    question: 'What is the 3-digit code?',
    answer: '843',
  },
]
