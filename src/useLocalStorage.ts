import { useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  function set(val: T | ((prev: T) => T)) {
    setState(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return [state, set];
}
