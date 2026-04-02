import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { computeDaysOverdue } from '@/utils/people';
import type { Person } from '@/types';

interface UsePeopleResult {
  people: Person[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updatePerson: (id: string, changes: Partial<Person>) => void;
  addPerson: (person: Person) => void;
}

export function usePeople(): UsePeopleResult {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('people')
      .select('*')
      .eq('user_id', user.id);

    if (__DEV__) {
      console.log('[usePeople] row count:', data?.length ?? 0);
    }

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const mapped: Person[] = (data ?? []).map((row) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      photo: row.photo ?? undefined,
      type: row.type,
      cadence_tier: row.cadence_tier,
      where_from: row.where_from ?? undefined,
      birthday: row.birthday ?? undefined,
      nudge_interaction_type: row.nudge_interaction_type,
      date_added: row.date_added,
      last_interaction_date: row.last_interaction_date ?? undefined,
      last_interaction_note: row.last_interaction_note ?? undefined,
      days_overdue: computeDaysOverdue(row.last_interaction_date, row.cadence_tier),
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
    }));

    setPeople(mapped);
    setLoading(false);
  }, []);

  // Bug 7: updatePerson recomputes days_overdue after merge
  const updatePerson = useCallback((id: string, changes: Partial<Person>) => {
    setPeople((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...changes };
      return {
        ...merged,
        days_overdue: computeDaysOverdue(merged.last_interaction_date, merged.cadence_tier),
      };
    }));
  }, []);

  const addPerson = useCallback((person: Person) => {
    setPeople((prev) => [person, ...prev]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { people, loading, error, refetch: load, updatePerson, addPerson };
}
