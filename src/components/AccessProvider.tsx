'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

// The current user's effective subscription level: 0 free · 1 standard · 2 premium.
// It calls the same `current_access_level()` SQL function the RLS policies use, so
// the UI and the database can never disagree about what a user is entitled to.
// (This is only the *show*-gate — the real protection is RLS on the data.)
type AccessContextValue = {
  level: number;
  loading: boolean;
  refresh: () => void; // re-check after a subscription change (used in Phase 4)
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [level, setLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.rpc("current_access_level");
      if (cancelled) return;
      setLevel(error || typeof data !== "number" ? 0 : data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, nonce]);

  return (
    <AccessContext.Provider value={{ level, loading, refresh: () => setNonce((n) => n + 1) }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccessLevel() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccessLevel must be used within an AccessProvider");
  return ctx;
}
