'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { store } from '@/lib/store';
import type { EntityType } from '@/lib/realtime-engine';

/**
 * Universal realtime hook for any page.
 * 
 * Usage:
 *   const { data } = useRealtime('reports', () => store.getReports());
 * 
 * Automatically:
 * - Subscribes to `<entityType>-updated` CustomEvent
 * - Re-fetches data from store when event fires
 * - Returns fresh data array
 */
export function useRealtime<T>(
  entityType: EntityType,
  getData: () => T[],
): { data: T[]; refresh: () => void } {
  const [data, setData] = useState<T[]>(() => getData());
  const mountedRef = useRef(true);

  // Store getData in a ref so we always call the latest version
  // without causing effect re-runs
  const getDataRef = useRef(getData);
  getDataRef.current = getData;

  const refresh = useCallback(() => {
    if (!mountedRef.current) return;
    const fresh = getDataRef.current();
    if (Array.isArray(fresh)) {
      setData(prev => {
        // Only update if the content actually changed (compare length + first/last items)
        if (prev.length === fresh.length) {
          // Quick check: if same reference, no change
          if (prev === fresh) return prev;
          // Deep check: compare first and last items by JSON (cheap heuristic)
          if (prev.length > 0) {
            const pFirst = prev[0];
            const fFirst = fresh[0];
            if (pFirst && fFirst && JSON.stringify(pFirst) === JSON.stringify(fFirst)) {
              const pLast = prev[prev.length - 1];
              const fLast = fresh[fresh.length - 1];
              if (JSON.stringify(pLast) === JSON.stringify(fLast)) {
                // Likely same data, keep old reference to prevent re-render
                return prev;
              }
            }
          } else {
            // Both empty arrays — no change
            return prev;
          }
        }
        // Data actually changed — create new array reference
        return [...fresh];
      });
    } else {
      setData(fresh as any);
    }
  }, []); // No dependencies — stable reference

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    refresh();

    // Listen for realtime updates — entityType is captured once in the effect
    const specificHandler = () => refresh();
    const legacyHandler = () => refresh();

    window.addEventListener(`${entityType}-updated`, specificHandler);
    // Also listen to legacy 'reports-updated' for backward compat
    if (entityType === 'reports') {
      window.addEventListener('reports-updated', legacyHandler);
    }

    return () => {
      mountedRef.current = false;
      window.removeEventListener(`${entityType}-updated`, specificHandler);
      if (entityType === 'reports') {
        window.removeEventListener('reports-updated', legacyHandler);
      }
    };
  }, [entityType, refresh]); // refresh is stable (empty deps), entityType is a string literal

  return { data, refresh };
}

/**
 * Hook for single entity by ID (e.g., report detail page).
 * Re-fetches when the entity changes in DB.
 */
export function useRealtimeEntity<T>(
  entityType: EntityType,
  getId: () => string | undefined,
  getData: (id: string) => T | undefined,
): { entity: T | undefined; refresh: () => void } {
  const [entity, setEntity] = useState<T | undefined>(() => {
    const id = getId();
    return id ? getData(id) : undefined;
  });

  // Store callbacks in refs for stable references
  const getIdRef = useRef(getId);
  getIdRef.current = getId;
  const getDataRef = useRef(getData);
  getDataRef.current = getData;

  const refresh = useCallback(() => {
    const id = getIdRef.current();
    if (id) {
      const fresh = getDataRef.current(id);
      setEntity(prev => {
        if (!prev && !fresh) return prev;
        if (prev && fresh && JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
        return fresh ? { ...fresh } as T : undefined;
      });
    }
  }, []); // Stable

  useEffect(() => {
    refresh();

    const specificHandler = () => refresh();
    const legacyHandler = () => refresh();

    window.addEventListener(`${entityType}-updated`, specificHandler);
    if (entityType === 'reports') {
      window.addEventListener('reports-updated', legacyHandler);
    }

    return () => {
      window.removeEventListener(`${entityType}-updated`, specificHandler);
      if (entityType === 'reports') {
        window.removeEventListener('reports-updated', legacyHandler);
      }
    };
  }, [entityType, refresh]);

  return { entity, refresh };
}

/**
 * Hook to track active users via Presence.
 */
export function useActiveUsers() {
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string; onlineAt: string }>>([]);

  useEffect(() => {
    const handler = ((e: CustomEvent) => {
      setUsers(e.detail || []);
    }) as EventListener;

    window.addEventListener('presence-changed', handler);

    return () => {
      window.removeEventListener('presence-changed', handler);
    };
  }, []);

  return users;
}
