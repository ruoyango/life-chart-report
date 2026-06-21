'use client';

import { useState } from "react";
import { Section } from "../Section";
import { BaseChart } from "../BaseChart";
import { ChartModeToggle, type ChartMode } from "../ChartModeToggle";
import { shadowChart, type Chart } from "../../lib/numerology";

export function ChartSection({ chart }: { chart: Chart }) {
  const [mode, setMode] = useState<ChartMode>("normal");
  const shown = mode === "shadow" ? shadowChart(chart) : chart;

  return (
    <Section title="个人蓝图">
      <div className="mt-16 mb-8 flex justify-center print:mt-4 print:mb-2">
        <div
          className={`@container w-full max-w-2xl print:max-w-xs ${
            mode === "shadow" ? "chart-shadow export-hide" : ""
          }`}
        >
          <BaseChart chart={shown} />
        </div>
        {/* In shadow mode, also render the normal chart (hidden on screen) so the
            PDF export shows 个人蓝图 mode without changing what's displayed. */}
        {mode === "shadow" && (
          <div className="export-only hidden @container w-full max-w-2xl print:max-w-xs">
            <BaseChart chart={chart} />
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <ChartModeToggle mode={mode} onChange={setMode} />
      </div>
    </Section>
  );
}
