import { useState, useEffect, useCallback } from 'react';
import { supabase, DEV_USER_ID } from '@/lib/supabase';
import { computeDaysOverdue } from '@/utils/people';
import type { Person } from '@/types';

interface UsePeopleResult {
  people: Person[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updatePerson: (id: string, changes: Partial<Person>) => void;
}

export function usePeople(): UsePeopleResult {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    console.log('[usePeople] DEV_USER_ID:', DEV_USER_ID);
    console.log('[usePeople] running query: SELECT * FROM people WHERE user_id =', DEV_USER_ID);

    const { data, error: fetchError, status, statusText } = await supabase
      .from('people')
      .select('*')
      .eq('user_id', DEV_USER_ID);

    console.log('[usePeople] HTTP status:', status, statusText);
    console.log('[usePeople] raw error:', JSON.stringify(fetchError, null, 2));
    console.log('[usePeople] raw data (full):', JSON.stringify(data, null, 2));
    console.log('[usePeople] row count:', data?.length ?? 0);
    if (data && data.length > 0) {
      console.log('[usePeople] first row keys:', Object.keys(data[0]));
      console.log('[usePeople] first row sample:', JSON.stringify(data[0], null, 2));
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
      type: row.type,
      cadence_tier: row.cadence_tier,
      where_from: row.where_from ?? undefined,
      birthday: row.birthday ?? undefined,
      nudge_interaction_type: row.nudge_interaction_type,
      date_added: row.date_added,
      last_interaction_date: row.last_interaction_date ?? undefined,
      last_interaction_note: row.last_interaction_note ?? undefined,
      days_overdue: computeDaysOverdue(row.last_interaction_date, row.cadence_tier),
    }));

    setPeople(mapped);
    setLoading(false);
  }, []);

  const updatePerson = useCallback((id: string, changes: Partial<Person>) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { people, loading, error, refetch: load, updatePerson };
}
