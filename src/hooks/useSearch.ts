'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAll, SearchResults, SearchResult, SearchResultType } from '@/lib/search';

const EMPTY_RESULTS: SearchResults = {
  reports: [], beneficiaries: [], employees: [], banks: [], tasks: [], notifications: [], total: 0,
};

const RESULTS_KEYS: (keyof Pick<SearchResults, 'reports' | 'beneficiaries' | 'employees' | 'banks' | 'tasks' | 'notifications'>)[] =
  ['reports', 'beneficiaries', 'employees', 'banks', 'tasks', 'notifications'];

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [activeType, setActiveType] = useState<SearchResultType | null>(null);
  const abortRef = useRef(false);

  const debouncedQuery = useDebounce(query, 150);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 1) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    abortRef.current = false;
    setIsSearching(true);

    const timer = setTimeout(() => {
      if (!abortRef.current) {
        const result = searchAll(debouncedQuery);
        setResults(result);
        setIsSearching(false);
      }
    }, 50);

    return () => {
      abortRef.current = true;
      clearTimeout(timer);
    };
  }, [debouncedQuery]);

  const open = useCallback(() => setQuery(''), []);
  const close = useCallback(() => {
    setQuery('');
    setResults(EMPTY_RESULTS);
    setActiveType(null);
  }, []);

  const TYPE_TO_KEY: Record<SearchResultType, 'reports' | 'beneficiaries' | 'employees' | 'banks' | 'tasks' | 'notifications'> = {
    report: 'reports', beneficiary: 'beneficiaries', employee: 'employees',
    bank: 'banks', task: 'tasks', notification: 'notifications',
  };

  const getVisibleResults = useCallback((): SearchResult[] => {
    if (activeType) {
      return results[TYPE_TO_KEY[activeType]];
    }
    const all: SearchResult[] = [];
    for (const key of RESULTS_KEYS) {
      all.push(...results[key]);
    }
    return all.sort((a, b) => b.relevance - a.relevance).slice(0, 12);
  }, [results, activeType]);

  return {
    query, setQuery,
    results, isSearching,
    activeType, setActiveType,
    visibleResults: getVisibleResults(),
    open, close,
    hasResults: results.total > 0,
  };
}
