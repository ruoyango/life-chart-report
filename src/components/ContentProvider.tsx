'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import {
  EMPTY_CONTENT,
  buildContentData,
  collectStorySources,
  getCareerPlan,
  getCharacteristicsLine,
  getHealthLine,
  getMajorMinorLine,
  getRootLine,
  getStoryLine,
  type ContentData,
  type ContentRow,
  type StorySource,
} from "../lib/content";
import { type Chart } from "../lib/numerology";

type ContentContextValue = {
  loading: boolean;
  getRootLine: (num: string | number) => string;
  getStoryLine: (num: string | number) => string;
  getCharacteristicsLine: (key: string, num: string | number) => string;
  getMajorMinorLine: (index: number, num: number) => string;
  getHealthLine: (element: string, count: number) => string;
  getCareerPlan: (element: string) => { element: string; line: string }[];
  collectStorySources: (chart: Chart) => StorySource[];
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<ContentData>(EMPTY_CONTENT);
  const [loading, setLoading] = useState(true);

  // Re-fetch whenever the signed-in user changes: the rows RLS returns depend on
  // their subscription tier, so a login (or logout) can change what's visible.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("content")
        .select("section,subtype,item_key,line");
      if (cancelled) return;
      if (error) {
        // A failed fetch (or no entitlement) leaves the content empty rather than
        // crashing — the sections then render their normal empty state.
        setData(EMPTY_CONTENT);
      } else {
        setData(buildContentData((rows ?? []) as ContentRow[]));
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const value = useMemo<ContentContextValue>(
    () => ({
      loading,
      getRootLine: (num) => getRootLine(data, num),
      getStoryLine: (num) => getStoryLine(data, num),
      getCharacteristicsLine: (key, num) => getCharacteristicsLine(data, key, num),
      getMajorMinorLine: (index, num) => getMajorMinorLine(data, index, num),
      getHealthLine: (element, count) => getHealthLine(data, element, count),
      getCareerPlan: (element) => getCareerPlan(data, element),
      collectStorySources: (chart) => collectStorySources(data, chart),
    }),
    [data, loading],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within a ContentProvider");
  return ctx;
}
