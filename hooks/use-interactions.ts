import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Interaction, InteractionType } from '@/types';

interface UseInteractionsResult {
  interactions: Interaction[];
  loading: boolean;
  refetch: () => void;
}

export function useInteractions(personId: string): UseInteractionsResult {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('person_id', personId)
      .order('date_of_interaction', { ascending: false });

    if (!error && data) {
      setInteractions(
        data.map((row) => ({
          id: row.id,
          person_id: row.person_id,
          date_of_interaction: row.date_of_interaction,
          date_logged: row.date_logged,
          type: row.type as InteractionType,
          notes: row.notes ?? undefined,
        }))
      );
    }
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    load();
  }, [load]);

  return { interactions, loading, refetch: load };
}
