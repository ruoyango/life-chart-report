'use client';

import { useRef, useState } from "react";
import { Section } from "../../components/Section";
import { BaseChart } from "../../components/BaseChart";
import { computeChart, cumulativeChart } from "../../lib/numerology";

const inputClass =
  "w-full rounded-md border border-amber-200 px-3 py-2 text-zinc-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";
const labelClass = "text-left text-sm font-medium text-zinc-700";

// 合数 page — input section with a variable number of birth dates (starts with 2).
export default function HeshuPage() {
  const [dates, setDates] = useState([
    { id: 0, value: "" },
    { id: 1, value: "" },
  ]);
  const nextId = useRef(2);

  const update = (id: number, value: string) =>
    setDates((prev) => prev.map((d) => (d.id === id ? { ...d, value } : d)));
  const add = () =>
    setDates((prev) => [...prev, { id: nextId.current++, value: "" }]);
  const remove = (id: number) =>
    setDates((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== id) : prev));

  const charts = dates.map((d) => computeChart(d.value));

  return (
    <>
    <div id="sec-heshu" className="w-full scroll-mt-24">
      <Section title="合数">
        <div className="mt-4 flex flex-col gap-3">
          {dates.map((d, i) => (
            <div key={d.id} className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label htmlFor={`birthDate-${d.id}`} className={labelClass}>
                  Person {String.fromCharCode(65 + i)}
                </label>
                <input
                  id={`birthDate-${d.id}`}
                  type="date"
                  value={d.value}
                  onChange={(e) => update(d.id, e.target.value)}
                  suppressHydrationWarning
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(d.id)}
                disabled={dates.length <= 1}
                aria-label="移除"
                title="移除"
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-amber-200 text-amber-700 transition hover:bg-amber-100 hover:text-amber-900 disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="mt-1 self-start rounded-lg border border-dashed border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 hover:text-amber-900"
          >
            + 添加出生日期
          </button>
        </div>
      </Section>
    </div>

    {/* One diagram per birth date, 2 per row. */}
    <div id="sec-heshu-charts" className="w-full scroll-mt-24">
      <Section title="个人蓝图">
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {dates.map((d, i) => (
            <div key={d.id} className="flex flex-col">
              <h3 className="mb-2 text-base font-semibold text-amber-900">
                Person {String.fromCharCode(65 + i)}
              </h3>
              <div className="@container w-full">
                <BaseChart chart={charts[i]} />
              </div>
            </div>
          ))}
        </div>

        {/* Big cumulative diagram — each person's reducedBirthDate on top, summed
            into the first row, then the rest of the pyramid derived from it. */}
        <div className="mt-10">
          <h3 className="mb-2 text-base font-semibold text-amber-900">合数</h3>
          <div className="@container mx-auto w-full max-w-2xl">
            <BaseChart
              chart={cumulativeChart(charts)}
              topRows={charts.map((c) => c.reducedBirthDate)}
            />
          </div>
        </div>
      </Section>
    </div>
    </>
  );
}
