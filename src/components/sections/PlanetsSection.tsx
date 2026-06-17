import { Section, EmptyHint } from "../Section";
import { icToNumber, type Chart } from "../../lib/numerology";
import { pairToPlanet, PLANETS_ORDER } from "../../lib/planets";

// Adjacent 2-digit combinations of a digit string (sliding window, step 1).
// "19123456701" → ["19","91","12","23","34","45","56","67","70","01"] (n-1 rows).
function pairRows(raw: string): string[] {
  const digits = (raw ?? "").replace(/\D/g, "");
  const rows: string[] = [];
  for (let i = 0; i + 1 < digits.length; i++) rows.push(digits.slice(i, i + 2));
  return rows;
}

// One source table: column "数字" = a list of 2-digit numbers, column "行星" =
// the planet each number maps to.
function PairTable({
  title,
  note,
  rows,
}: {
  title: string;
  note?: string;
  rows: string[];
}) {
  return (
    <div className="subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <h3 className="mb-3 flex flex-wrap items-baseline gap-x-2 text-base font-semibold text-amber-900">
        {title}
        {note && <span className="font-mono text-sm font-normal text-amber-700">{note}</span>}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-left text-zinc-500">
            <th className="pb-2 font-medium">数字</th>
            <th className="pb-2 text-right font-medium">行星</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pair, i) => (
            <tr key={i} className="border-b border-amber-100/70">
              <td className="py-1.5 font-mono tabular-nums text-zinc-700">{pair}</td>
              <td className="py-1.5 text-right font-medium text-amber-800">
                {pairToPlanet(pair)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr className="border-b border-amber-100/70">
              <td className="py-1.5 text-zinc-400" colSpan={2}>
                （请先输入）
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Right-hand table: how many times each of the eight planets appears across all
// three source tables (the 数字 → 行星 mappings), plus a grand total.
function CumulativeTable({ counts }: { counts: Record<string, number> }) {
  const grand = PLANETS_ORDER.reduce((sum, p) => sum + (counts[p] ?? 0), 0);
  return (
    <div className="subcard rounded-xl border border-amber-400 bg-amber-50 p-4 ring-1 ring-amber-200">
      <h3 className="mb-3 text-base font-semibold text-amber-900">总数</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-left text-zinc-500">
            <th className="pb-2 font-medium">行星</th>
            <th className="pb-2 text-right font-medium">总数</th>
          </tr>
        </thead>
        <tbody>
          {PLANETS_ORDER.map((planet) => {
            const count = counts[planet] ?? 0;
            return (
              <tr key={planet} className="border-b border-amber-100/70">
                <td className="py-1.5 font-medium text-amber-800">{planet}</td>
                <td
                  className={`py-1.5 text-right font-semibold tabular-nums ${
                    count === 0 ? "text-zinc-400" : "text-amber-800"
                  }`}
                >
                  {count}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-amber-200 font-semibold text-amber-900">
            <td className="py-1.5">合计</td>
            <td className="py-1.5 text-right tabular-nums">{grand}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PlanetsSection({
  birthDate,
  ic,
  phone,
  chart,
}: {
  birthDate: string;
  ic: string;
  phone: string;
  chart: Chart;
}) {
  // IC like "S1234567A" → "19123456701", shown beside the 身份证 table title.
  const icNumber = icToNumber(ic);

  // 人生蓝图 = the numbers shown in the 数字故事 section (root number + the unique
  // story numbers), with the two single-digit ones expanded to 2 digits:
  //   • rootNumber  →  rootNumber + middle[0]
  //   • middle[1]   →  middle[1]  + middle[1]   (the only single-digit story entry)
  const { rootNumber, middle, uniqueStoryNumbers } = chart;
  const blueprintRows = birthDate
    ? [
        `${rootNumber}${middle[0]}`,
        ...uniqueStoryNumbers.map((n) => (n.length === 1 ? `${n}${n}` : n)),
      ]
    : [];

  // The three source tables.
  const sources = [
    { title: "人生蓝图", rows: blueprintRows, note: undefined as string | undefined },
    { title: "身份证", rows: pairRows(icNumber), note: icNumber || undefined },
    { title: "手机号码", rows: pairRows(phone), note: phone.trim() || undefined },
  ];
  // Tally every number's planet across all three source tables.
  const planetCounts: Record<string, number> = Object.fromEntries(
    PLANETS_ORDER.map((p) => [p, 0]),
  );
  for (const s of sources) {
    for (const num of s.rows) {
      const planet = pairToPlanet(num);
      if (planet) planetCounts[planet] += 1;
    }
  }

  return (
    <Section title="八大行星">
      {birthDate ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {/* Left column: three stacked source tables (makes the column tall). */}
          <div className="space-y-6">
            {sources.map((s) => (
              <PairTable key={s.title} title={s.title} note={s.note} rows={s.rows} />
            ))}
          </div>

          {/* Right column: cumulative table. `self-start` keeps it content-height
              so it can travel inside the tall grid track; `lg:sticky` pins it
              (roughly centred via top = 50vh − half its height) until the section
              ends. Unstuck on mobile (single column) and in print. */}
          <div className="self-start lg:sticky lg:top-[calc(50vh-7rem)] print:static">
            <CumulativeTable counts={planetCounts} />
          </div>
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}
