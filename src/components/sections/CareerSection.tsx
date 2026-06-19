'use client';

import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { CAREER_RANKS, ELEMENT_META } from "../../lib/content";
import { useContent } from "../ContentProvider";
import { useGate, LockedShell, LOCKED_LINE } from "../Gate";

export function CareerSection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { careerElement } = chart;
  const { getCareerPlan } = useContent();
  const { locked } = useGate(1);
  // When locked, render three generic rank cards (no element, no real text) so
  // the recommended element order isn't exposed.
  const plan = locked
    ? CAREER_RANKS.map(() => ({ element: "", line: "" }))
    : getCareerPlan(careerElement);
  return (
    <Section title="事业和职业选择">
      {birthDate ? (
        <LockedShell locked={locked}>
          <ol className="mt-4 space-y-4">
            {plan.map(({ element, line }, index) => {
              const meta = locked ? null : ELEMENT_META[element];
              const isTop = index === 0;
              return (
                <li
                  key={index}
                  className={`rounded-xl border p-4 transition sm:p-5 ${
                    isTop && !locked
                      ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200"
                      : "subcard border-amber-100 bg-amber-50/40 hover:bg-amber-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                      style={{ backgroundColor: meta ? meta.color : "#d4d4d8" }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-base font-semibold text-amber-900">
                      {CAREER_RANKS[index]}
                    </span>
                    {meta && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                      >
                        {meta.label}行
                      </span>
                    )}
                    {isTop && !locked && (
                      <span className="ml-auto rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-white">
                        ★ 最推荐
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-zinc-700">
                    {locked ? LOCKED_LINE : line}
                  </p>
                </li>
              );
            })}
          </ol>
        </LockedShell>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}
