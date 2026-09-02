// Weekly structure for the progress dashboard — a full 36-week school year.
// Only Week 1 is backed by real content (Lessons 1-7) right now. Weeks 2-36
// mirror the same visual structure (same 7 badges + a mystery box) so the
// pattern is in place, but they aren't wired to any real lesson content
// yet, so they'll always show as freshly locked until that content exists.
export const WEEKLY_REWARD = 3

export const WEEKS = Array.from({ length: 36 }, (_, i) => ({
  week: i + 1,
  days: [1, 2, 3, 4, 5, 6, 7],
  active: i === 0,
}))
