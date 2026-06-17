import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { getSummaryLine } from "../../lib/content";

const cardClass =
  "subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition hover:bg-amber-50";
const bodyClass = "mt-2 whitespace-pre-line leading-relaxed text-zinc-700";

export function AiSummarySection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  return (
    <Section title="总体故事">
      {birthDate ? (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div key='0' className={cardClass}>
            <p className={bodyClass}>
              {getSummaryLine()}
            </p>
          </div>
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}
