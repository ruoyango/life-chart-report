'use client';

import { useEffect, useState } from "react";
import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { collectStorySources } from "../../lib/content";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../AuthProvider";

const cardClass = "subcard rounded-xl border border-amber-100 bg-amber-50/60 p-5";
const bodyClass = "whitespace-pre-line leading-relaxed text-zinc-700";
const btnClass =
  "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60";

export function AiSummarySection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { user } = useAuth();
  const [story, setStory] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A previously generated story belongs to the old birth date — clear it (and
  // any error) whenever the date changes, so it can't be mistaken for the new one.
  useEffect(() => {
    setStory(null);
    setError(null);
  }, [birthDate]);

  const generate = async () => {
    if (!supabase) {
      setError("AI 服务尚未配置。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Gather the personalised lines from the five source sections and hand
      // them to the Edge Function, which calls Claude server-side.
      const sections = collectStorySources(chart);
      const { data, error: fnError } = await supabase.functions.invoke<{ text: string }>(
        "life-summary",
        { body: { sections } },
      );
      if (fnError) throw fnError;
      setStory(data?.text ?? "");
    } catch (e) {
      // supabase-js reports non-2xx responses as a generic message and tucks the
      // function's real JSON body into error.context (a Response). Surface it.
      let msg = e instanceof Error ? e.message : "生成失败，请稍后再试。";
      const ctx = (e as { context?: Response })?.context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const body = await ctx.json();
          if (body?.error) msg = body.error;
        } catch {
          /* body wasn't JSON — keep the generic message */
        }
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="总体故事">
      {birthDate ? (
        <div className="mt-4 flex flex-col gap-4">
          {!user ? (
            <p className="leading-relaxed text-zinc-500">请先登录以生成您的总体故事。</p>
          ) : story ? (
            <div className={cardClass}>
              <p className={bodyClass}>{story}</p>
              <button type="button" onClick={generate} disabled={busy} className={`mt-4 ${btnClass}`}>
                {busy ? "生成中…" : "重新生成"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="leading-relaxed text-zinc-500">
                综合「数字故事 · 隐藏性格 · 能力分布 · 健康关系 · 事业和职业选择」，
                生成一段专属于您的人生故事。
              </p>
              <button type="button" onClick={generate} disabled={busy} className={btnClass}>
                {busy ? "生成中…" : "生成总体故事"}
              </button>
            </div>
          )}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}
