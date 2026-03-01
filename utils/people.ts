import { Palette } from '@/constants/theme';
import type { Person, InteractionType } from '@/types';

export function tierColor(tier: Person['cadence_tier']): string {
  if (tier === 'close_friend' || tier === 'active') return Palette.accent;
  if (tier === 'keep_warm') return Palette.midTier;
  return Palette.lightTier;
}

export function tierLabel(tier: Person['cadence_tier']): string {
  if (tier === 'close_friend') return 'Close Friend';
  if (tier === 'keep_warm') return 'Keep Warm';
  if (tier === 'dont_lose_touch') return "Don't Lose Touch";
  if (tier === 'active') return 'Active';
  return tier;
}

export function tierIconName(tier: Person['cadence_tier'], type: Person['type']): string {
  if (tier === 'close_friend') return 'camera.fill';
  if (tier === 'active') return 'bolt.fill';
  if (tier === 'keep_warm') return type === 'friend' ? 'leaf.fill' : 'anchor';
  return type === 'friend' ? 'wind' : 'antenna.radiowaves.left.and.right';
}

export function nudgeIconName(type: InteractionType): string {
  if (type === 'call') return 'phone.fill';
  if (type === 'facetime') return 'video.fill';
  if (type === 'text') return 'message.fill';
  if (type === 'email') return 'envelope.fill';
  return 'person.2.fill'; // in_person
}

export function nudgeLabel(type: InteractionType): string {
  if (type === 'call') return 'Call';
  if (type === 'facetime') return 'FaceTime';
  if (type === 'text') return 'Text';
  if (type === 'email') return 'Email';
  return 'In Person';
}

const TODAY = new Date();

export function relativeTime(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const diff = Math.round((TODAY.getTime() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return 'Last week';
  const weeks = Math.round(diff / 7);
  if (weeks < 9) return `${weeks} weeks ago`;
  const months = Math.round(diff / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.round(diff / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export function futureRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  if (diff < 14) return 'In 1 week';
  const weeks = Math.round(diff / 7);
  if (weeks < 5) return `In ${weeks} weeks`;
  const months = Math.round(diff / 30);
  return `In ${months} month${months > 1 ? 's' : ''}`;
}

export function birthdayRelativeDate(birthdayStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bday = new Date(birthdayStr);
  bday.setFullYear(today.getFullYear());
  bday.setHours(0, 0, 0, 0);
  if (bday < today) bday.setFullYear(today.getFullYear() + 1);
  return futureRelativeDate(bday.toISOString().split('T')[0]);
}

export function upcomingBirthdays(people: Person[], daysAhead = 60): Person[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return people
    .filter((p) => !!p.birthday)
    .map((p) => {
      const bday = new Date(p.birthday!);
      bday.setFullYear(today.getFullYear());
      bday.setHours(0, 0, 0, 0);
      if (bday < today) bday.setFullYear(today.getFullYear() + 1);
      return { person: p, diff: Math.round((bday.getTime() - today.getTime()) / 86400000) };
    })
    .filter(({ diff }) => diff <= daysAhead)
    .sort((a, b) => a.diff - b.diff)
    .map(({ person }) => person);
}

export function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Cadence ──────────────────────────────────────────────────────────────────

// How many days between expected interactions per tier.
// close_friend / active → bi-weekly; keep_warm → monthly; dont_lose_touch → quarterly.
export const CADENCE_DAYS: Record<string, number> = {
  close_friend: 14,
  active: 14,
  keep_warm: 30,
  dont_lose_touch: 90,
};

/**
 * Compute how many days overdue a person is.
 * Positive = overdue, negative = days until due, 0 = due today.
 * If they've never been contacted, treat as overdue by the full cadence period.
 */
export function computeDaysOverdue(
  lastInteractionDate: string | null | undefined,
  tier: string,
): number {
  const cadenceDays = CADENCE_DAYS[tier] ?? 30;
  if (!lastInteractionDate) return cadenceDays;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastInteractionDate + 'T00:00:00');
  last.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - last.getTime()) / 86400000);
  return daysSince - cadenceDays;
}
