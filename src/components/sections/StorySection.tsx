'use client';

import { Section, EmptyHint } from "../Section";
import { BoxHeader } from "../BoxHeader";
import { show, type Chart } from "../../lib/numerology";
import { getStoryTitles } from "../../lib/content";
import { useContent } from "../ContentProvider";
import { useGate, LockedShell, LOCKED_LINE } from "../Gate";

const cardClass =
  "subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition hover:bg-amber-50";
const bodyClass = "mt-2 whitespace-pre-line leading-relaxed text-zinc-700";

export function StorySection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { rootNumber, uniqueStoryNumbers } = chart;
  const { getRootLine, getStoryLine } = useContent();
  const { locked } = useGate(1);
  return (
    <Section title="数字故事">
      {birthDate ? (
        <LockedShell locked={locked}>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={cardClass}>
              <BoxHeader badge={locked ? 0 : show(rootNumber)} title="根数 — 主性格" titleColor="#ff1100" />
              <p className={bodyClass}>{locked ? LOCKED_LINE : getRootLine(rootNumber)}</p>
            </div>
            {locked
              ? // Fixed placeholders so neither the real numbers nor how many
                // there are can be read from the DOM.
                [0, 1, 2].map((i) => (
                  <div key={i} className={cardClass}>
                    <BoxHeader badge={0} title="" titleColor="#a34d2b" />
                    <p className={bodyClass}>{LOCKED_LINE}</p>
                  </div>
                ))
              : uniqueStoryNumbers.map((num) => (
                  <div key={num} className={cardClass}>
                    <BoxHeader
                      badge={num}
                      title={getStoryTitles(num)}
                      titleColor={Number(num) < 10 ? "#ff1100" : "#a34d2b"}
                    />
                    <p className={bodyClass}>{getStoryLine(num)}</p>
                  </div>
                ))}
          </div>
        </LockedShell>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}
