import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Interaction, InteractionType } from '@/types';

interface UseAllInteractionsResult {
  interactions: Interaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAllInteractions(): UseAllInteractionsResult {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
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
      .from('interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date_of_interaction', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { interactions, loading, error, refetch: load };
}
