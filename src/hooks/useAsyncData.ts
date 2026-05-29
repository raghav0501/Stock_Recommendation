import { useState, useEffect, useRef, type Dispatch, type SetStateAction, type DependencyList } from 'react';

interface UseAsyncDataOptions<T> {
  onError?: (err: unknown) => void;
  onSuccess?: (data: T) => void;
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  initialValue: T,
  deps: DependencyList = [],
  options: UseAsyncDataOptions<T> = {}
): { data: T; setData: Dispatch<SetStateAction<T>>; loading: boolean; error: unknown | null } {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const fetchRef = useRef(fetchFn);
  const optionsRef = useRef(options);
  fetchRef.current = fetchFn;
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRef.current()
      .then(d => {
        if (!cancelled) {
          setData(d);
          optionsRef.current.onSuccess?.(d);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e);
          optionsRef.current.onError?.(e);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error };
}
