export type CadenceTier = 'close_friend' | 'keep_warm' | 'dont_lose_touch';
export type NetworkTier = 'active' | 'keep_warm' | 'dont_lose_touch';
export type PersonType = 'friend' | 'network';
export type InteractionType = 'call' | 'facetime' | 'text' | 'email' | 'in_person';

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  type: PersonType;
  cadence_tier: CadenceTier | NetworkTier;
  where_from?: string;
  birthday?: string; // ISO date string 'YYYY-MM-DD'
  nudge_interaction_type: InteractionType;
  date_added: string; // ISO date string
  last_interaction_date?: string; // ISO date string, derived from interactions
  last_interaction_note?: string; // snippet from most recent interaction notes
  days_overdue?: number; // positive = overdue, negative = days until due, 0 = due today
}

export interface Interaction {
  id: string;
  person_id: string;
  date_of_interaction: string; // ISO date string
  date_logged: string; // ISO date string, auto-stamped
  type: InteractionType;
  notes?: string;
}

export interface UpcomingReminder {
  id: string;
  type: 'birthday' | 'holiday';
  label: string; // e.g. "Sarah's birthday" or "Thanksgiving"
  date: string; // ISO date string
  person_id?: string;
}
