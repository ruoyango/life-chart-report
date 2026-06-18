'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

// Like useState, but the value is saved to sessionStorage and restored on mount,
// so it survives client-side navigation away from and back to a page (the same
// mechanism InputProvider uses for the shared inputs). Restore happens in an
// effect (client-only) to avoid a hydration mismatch.
export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  // A state flag (not a ref) so the persist effect skips during the first commit,
  // before the restore has been applied — otherwise the initial value would
  // overwrite what was saved.
  const [hydrated, setHydrated] = useState(false);

  // Restore once on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore unavailable / malformed storage */
    }
    setHydrated(true);
  }, [key]);

  // Persist on change, once the initial restore has run.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state, hydrated]);

  return [state, setState];
}
