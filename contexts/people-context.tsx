import React, { createContext, useContext } from 'react';
import { usePeople } from '@/hooks/use-people';
import type { Person } from '@/types';

interface UsePeopleResult {
  people: Person[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updatePerson: (id: string, changes: Partial<Person>) => void;
}

const defaultValue: UsePeopleResult = {
  people: [],
  loading: true,
  error: null,
  refetch: () => {},
  updatePerson: () => {},
};

const PeopleContext = createContext<UsePeopleResult>(defaultValue);

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const value = usePeople();
  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export const usePeopleContext = () => useContext(PeopleContext);
