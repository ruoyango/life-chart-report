'use client';

import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { ELEMENT_META, getHealthStatus } from "../../lib/content";
import { useContent } from "../ContentProvider";
import { useGate, LockedShell, LOCKED_LINE } from "../Gate";

// When locked, the status chip always shows the green "balanced" state.
const LOCKED_STATUS = { label: "平衡", color: "#16a34a", bg: "#dcfce7", warn: false };

export function HealthSection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { countHealth } = chart;
  const { getHealthLine } = useContent();
  const { locked } = useGate(1);
  return (
    <Section title="健康关系">
      {birthDate ? (
        <LockedShell locked={locked}>
          <p className="-mt-2 mb-4 text-sm leading-relaxed text-zinc-500">
            根据五行分布评估健康倾向，
            <span className="font-medium text-amber-700">失衡</span>
            （缺少或偏多）的元素需多加注意。
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(countHealth).map(([element, realCount]) => {
              const meta = ELEMENT_META[element];
              const count = locked ? 0 : realCount;
              const status = locked ? LOCKED_STATUS : getHealthStatus(realCount);
              return (
                <div
                  key={element}
                  className="subcard rounded-xl border border-l-4 border-amber-100 bg-amber-50/60 p-4 transition hover:bg-amber-50"
                  style={{ borderLeftColor: meta.color }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      {status.label} · {count}次
                    </span>
                  </div>
                  {locked ? (
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-zinc-700">
                      {LOCKED_LINE}
                    </p>
                  ) : status.warn ? (
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-zinc-700">
                      {getHealthLine(element, realCount) || "此元素失衡，建议多加注意。"}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-zinc-500">状态良好，无需特别注意。</p>
                  )}
                </div>
              );
            })}
          </div>
        </LockedShell>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}
