import { useCallback, useEffect, useRef, useState } from 'react';

interface PaginatedList<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  sentinelRef: (node: HTMLElement | null) => void;
  reload: () => void;
  /** Локально изменить загруженные элементы (напр. обновить реакции) без перезагрузки. */
  mutate: (updater: (items: T[]) => T[]) => void;
}

// Offset-based infinite scroll over endpoints that return a bare array.
// hasMore is inferred from a short page (page.length < limit).
export function usePaginatedList<T>(
  fetchPage: (offset: number, limit: number) => Promise<T[]>,
  deps: unknown[],
  limit = 20,
): PaginatedList<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const requestIdRef = useRef(0);
  const stateRef = useRef({ offset: 0, hasMore: true, busy: false });
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const loadPage = useCallback(async (reset: boolean) => {
    const state = stateRef.current;
    if (state.busy || (!reset && !state.hasMore)) return;
    state.busy = true;
    const requestId = ++requestIdRef.current;
    const offset = reset ? 0 : state.offset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const page = await fetchPageRef.current(offset, limit);
      if (requestId !== requestIdRef.current) return;
      state.offset = offset + page.length;
      state.hasMore = page.length === limit;
      setHasMore(state.hasMore);
      setItems((prev) => (reset ? page : [...prev, ...page]));
    } catch (err) {
      console.error('Failed to load page', err);
      if (requestId === requestIdRef.current && reset) setItems([]);
    } finally {
      if (requestId === requestIdRef.current) {
        state.busy = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    stateRef.current = { offset: 0, hasMore: true, busy: false };
    requestIdRef.current++;
    setHasMore(true);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey, loadPage]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) loadPage(false);
        },
        { rootMargin: '200px' },
      );
      observerRef.current.observe(node);
    },
    [loadPage],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const mutate = useCallback((updater: (items: T[]) => T[]) => {
    setItems((prev) => updater(prev));
  }, []);

  return { items, loading, loadingMore, hasMore, sentinelRef, reload, mutate };
}
