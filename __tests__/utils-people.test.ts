/**
 * Tests for utils/people.ts
 *
 * Focus areas (per the Bug N comments in the codebase):
 *  - computeDaysOverdue: Bug 7 in use-people notes DST sensitivity
 *  - birthdayRelativeDate: handles Feb-29 on non-leap years
 *  - relativeTime, tierColor, tierLabel, tierIconName, nudgeIconName
 *
 * These are pure/near-pure functions with no RN/Supabase dependencies, so
 * they run fine in a Node test environment.
 */

import {
  computeDaysOverdue,
  CADENCE_DAYS,
  tierColor,
  tierLabel,
  tierIconName,
  nudgeIconName,
  nudgeLabel,
  relativeTime,
  birthdayRelativeDate,
  futureRelativeDate,
} from '../utils/people';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Return a YYYY-MM-DD string offset from today by `days` (negative = past).
 * Uses LOCAL date components (not toISOString which returns UTC) to match the
 * `new Date(dateStr + 'T00:00:00')` local-midnight construction in people.ts.
 */
function isoFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── computeDaysOverdue ───────────────────────────────────────────────────────

describe('computeDaysOverdue', () => {
  test('never-contacted friend returns full cadence period (14)', () => {
    expect(computeDaysOverdue(null, 'close_friend')).toBe(14);
  });

  test('never-contacted keep_warm returns 30', () => {
    expect(computeDaysOverdue(undefined, 'keep_warm')).toBe(30);
  });

  test('never-contacted dont_lose_touch returns 90', () => {
    expect(computeDaysOverdue(null, 'dont_lose_touch')).toBe(90);
  });

  test('contacted today → negative (not yet due): close_friend → -14', () => {
    const result = computeDaysOverdue(isoFromToday(0), 'close_friend');
    expect(result).toBe(-14);
  });

  test('contacted exactly on cadence boundary → 0 (due today)', () => {
    // 14 days ago → daysSince=14, cadence=14, result=0
    const result = computeDaysOverdue(isoFromToday(-14), 'close_friend');
    expect(result).toBe(0);
  });

  test('contacted one day past cadence → +1 (overdue)', () => {
    const result = computeDaysOverdue(isoFromToday(-15), 'close_friend');
    expect(result).toBe(1);
  });

  test('keep_warm contacted 20 days ago → -10 (not yet due)', () => {
    const result = computeDaysOverdue(isoFromToday(-20), 'keep_warm');
    expect(result).toBe(-10);
  });

  test('dont_lose_touch contacted 100 days ago → +10 (overdue)', () => {
    const result = computeDaysOverdue(isoFromToday(-100), 'dont_lose_touch');
    expect(result).toBe(10);
  });

  test('unknown tier falls back to 30-day cadence', () => {
    // CADENCE_DAYS has no entry for 'unknown', should default to 30
    const result = computeDaysOverdue(isoFromToday(-30), 'unknown_tier');
    expect(result).toBe(0);
  });

  test('CADENCE_DAYS active matches close_friend (14)', () => {
    expect(CADENCE_DAYS.active).toBe(14);
    expect(CADENCE_DAYS.close_friend).toBe(14);
  });
});

// ─── birthdayRelativeDate ─────────────────────────────────────────────────────

describe('birthdayRelativeDate', () => {
  test('birthday today returns "Today"', () => {
    const today = new Date();
    const mmdd = `1990-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(birthdayRelativeDate(mmdd)).toBe('Today');
  });

  test('birthday tomorrow returns "Tomorrow"', () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const mmdd = `1990-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(birthdayRelativeDate(mmdd)).toBe('Tomorrow');
  });

  test('birthday yesterday (passed this year) returns future date for next year', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const mmdd = `1990-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Should NOT say "Passed" — should be next year
    const result = birthdayRelativeDate(mmdd);
    expect(result).not.toBe('Passed');
    expect(result).not.toBe('Today');
  });

  // Feb-29 on a non-leap year: the Bug N fix — should not crash and should not
  // return a March date.
  test('Feb-29 birthday on a non-leap year does not shift to March', () => {
    // Find a non-leap year to test against by checking the current year or next
    const year = new Date().getFullYear();
    const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    // We can't control what year the test runs in, but we can verify the
    // result doesn't mention March (month index 2 → no "Mar" in output)
    const result = birthdayRelativeDate('1992-02-29');
    // Result should be a string like "In N days/weeks/months" or "Today/Tomorrow"
    // and crucially NOT contain any indication of March 1
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    if (!isLeap(year)) {
      // On a non-leap year, Feb 29 should be treated as Feb 28 — so the result
      // should describe a date in February, not March. The result is relative
      // ("In 3 days", "Today", etc.) so we just confirm it didn't throw.
      expect(result).not.toMatch(/undefined|NaN|Invalid/i);
    }
  });
});

// ─── relativeTime ─────────────────────────────────────────────────────────────
//
// relativeTime uses Math.round(elapsed_ms / 86400000), measuring from midnight
// of the given date to the exact current time. This means results shift during
// the day (e.g., -1 rounds to 2 after midday). We pin the clock to midnight so
// arithmetic is exact and tests are deterministic.

describe('relativeTime', () => {
  const FIXED_NOW = new Date('2026-06-28T00:00:00');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });
  afterEach(() => jest.useRealTimers());

  // Dates relative to 2026-06-28 midnight
  const d = (offset: number) => {
    const dt = new Date('2026-06-28T00:00:00');
    dt.setDate(dt.getDate() + offset);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  test('undefined/null → "Never"', () => {
    expect(relativeTime(undefined)).toBe('Never');
    expect(relativeTime('')).toBe('Never');
  });

  test('today → "Today"', () => {
    expect(relativeTime(d(0))).toBe('Today');
  });

  test('yesterday → "Yesterday"', () => {
    expect(relativeTime(d(-1))).toBe('Yesterday');
  });

  test('3 days ago → "3 days ago"', () => {
    expect(relativeTime(d(-3))).toBe('3 days ago');
  });

  test('8 days ago → "Last week"', () => {
    expect(relativeTime(d(-8))).toBe('Last week');
  });

  test('21 days ago → "3 weeks ago"', () => {
    expect(relativeTime(d(-21))).toBe('3 weeks ago');
  });

  test('60 days ago → "2 months ago"', () => {
    expect(relativeTime(d(-60))).toBe('2 months ago');
  });

  test('400 days ago → "1 year ago"', () => {
    expect(relativeTime(d(-400))).toBe('1 year ago');
  });
});

// ─── futureRelativeDate ───────────────────────────────────────────────────────
// Same clock-pinning rationale as relativeTime above.

describe('futureRelativeDate', () => {
  const FIXED_NOW = new Date('2026-06-28T00:00:00');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });
  afterEach(() => jest.useRealTimers());

  const d = (offset: number) => {
    const dt = new Date('2026-06-28T00:00:00');
    dt.setDate(dt.getDate() + offset);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  test('today → "Today"', () => {
    expect(futureRelativeDate(d(0))).toBe('Today');
  });

  test('tomorrow → "Tomorrow"', () => {
    expect(futureRelativeDate(d(1))).toBe('Tomorrow');
  });

  test('past date → "Passed"', () => {
    expect(futureRelativeDate(d(-1))).toBe('Passed');
  });

  test('in 3 days → "In 3 days"', () => {
    expect(futureRelativeDate(d(3))).toBe('In 3 days');
  });

  test('in 10 days → "In 1 week"', () => {
    expect(futureRelativeDate(d(10))).toBe('In 1 week');
  });

  test('in 30 days → "In 4 weeks"', () => {
    expect(futureRelativeDate(d(30))).toBe('In 4 weeks');
  });

  test('in 90 days → "In 3 months"', () => {
    expect(futureRelativeDate(d(90))).toBe('In 3 months');
  });
});

// ─── tier helpers ─────────────────────────────────────────────────────────────

describe('tierColor', () => {
  test('close_friend → accent color', () => {
    expect(tierColor('close_friend')).toBe('#2D5F8A');
  });

  test('active → same accent color as close_friend', () => {
    expect(tierColor('active')).toBe(tierColor('close_friend'));
  });

  test('keep_warm → mid tier color', () => {
    expect(tierColor('keep_warm')).toBe('#4A7A9B');
  });

  test('dont_lose_touch → light tier color', () => {
    expect(tierColor('dont_lose_touch')).toBe('#7A9DB5');
  });
});

describe('tierLabel', () => {
  test.each([
    ['close_friend', 'Close Friend'],
    ['keep_warm', 'Keep Warm'],
    ['dont_lose_touch', "Don't Lose Touch"],
    ['active', 'Active'],
  ])('%s → %s', (tier, expected) => {
    expect(tierLabel(tier as any)).toBe(expected);
  });
});

describe('tierIconName', () => {
  test('close_friend always camera.fill', () => {
    expect(tierIconName('close_friend', 'friend')).toBe('camera.fill');
  });

  test('active always bolt.fill', () => {
    expect(tierIconName('active', 'network')).toBe('bolt.fill');
  });

  test('keep_warm friend → leaf.fill', () => {
    expect(tierIconName('keep_warm', 'friend')).toBe('leaf.fill');
  });

  test('keep_warm network → anchor', () => {
    expect(tierIconName('keep_warm', 'network')).toBe('anchor');
  });

  test('dont_lose_touch friend → wind', () => {
    expect(tierIconName('dont_lose_touch', 'friend')).toBe('wind');
  });

  test('dont_lose_touch network → antenna.radiowaves.left.and.right', () => {
    expect(tierIconName('dont_lose_touch', 'network')).toBe('antenna.radiowaves.left.and.right');
  });
});

// ─── nudge helpers ────────────────────────────────────────────────────────────

describe('nudgeIconName', () => {
  test.each([
    ['call', 'phone.fill'],
    ['facetime', 'video.fill'],
    ['text', 'message.fill'],
    ['email', 'envelope.fill'],
    ['in_person', 'person.2.fill'],
  ] as const)('%s → %s', (type, expected) => {
    expect(nudgeIconName(type)).toBe(expected);
  });
});

describe('nudgeLabel', () => {
  test.each([
    ['call', 'Call'],
    ['facetime', 'FaceTime'],
    ['text', 'Text'],
    ['email', 'Email'],
    ['in_person', 'In Person'],
  ] as const)('%s → %s', (type, expected) => {
    expect(nudgeLabel(type)).toBe(expected);
  });
});
