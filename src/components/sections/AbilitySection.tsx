'use client';

import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { getAbilityStatus } from "../../lib/content";
import { useContent } from "../ContentProvider";
import { useGate, LockedShell, LOCKED_LINE } from "../Gate";

// When locked, the status chip always shows the green "balanced" state so the
// real ability balance can't be read from the DOM.
const LOCKED_STATUS = { label: "刚刚好", color: "#16a34a", bg: "#dcfce7" };

export function AbilitySection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { countMajorMinor } = chart;
  const { getMajorMinorLine } = useContent();
  const { locked } = useGate(1);
  return (
    <Section title="能力分布">
      {birthDate ? (
        <LockedShell locked={locked}>
          <p className="-mt-2 mb-4 text-sm leading-relaxed text-zinc-500">
            数字 1–9 各代表一种能力，出现的次数反映其强弱：
            <span className="font-medium text-amber-700">缺少</span>、刚刚好或
            <span className="font-medium text-amber-700">偏多</span>。
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {countMajorMinor.map((realCount, index) => {
              const count = locked ? 0 : realCount;
              const status = locked ? LOCKED_STATUS : getAbilityStatus(realCount);
              return (
                <div
                  key={index + 1}
                  className="subcard rounded-xl border border-l-4 border-amber-100 bg-amber-50/60 p-4 transition hover:bg-amber-50"
                  style={{ borderLeftColor: status.color }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-lg font-bold text-amber-800">
                        {index + 1}
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      {status.label} · {count}次
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-zinc-700">
                    {locked ? LOCKED_LINE : getMajorMinorLine(index, realCount)}
                  </p>
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
