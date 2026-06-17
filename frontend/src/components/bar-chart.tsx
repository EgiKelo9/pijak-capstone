"use client";

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import * as React from "react";
import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";

export interface PerformanceData {
  date: string;
  score: number;
}

interface PerformanceBarChartProps {
  type: "forecasting" | "clustering";
  data: PerformanceData[];
  badgeLabel: string;
  badgeValue: string;
}

export function PerformanceBarChart({
  type,
  data,
  badgeLabel,
  badgeValue,
}: PerformanceBarChartProps) {
  const isForecasting = type === "forecasting";

  const uid = React.useId().replace(/:/g, "");
  const gradientId = `barGrad-${uid}`;

  const colorTop = isForecasting ? "#8FD6F0" : "#C8CDD6";

  // Config inside component — each instance gets its own isolated context,
  // which fixes the "second chart has no tooltip" bug.
  const chartConfig = {
    score: { label: "Score", color: colorTop },
  } satisfies ChartConfig;

  return (
    <div className="relative h-full w-full">
      {/* Badge */}
      <div
        className="absolute right-0 top-0 z-10 flex items-center gap-1 rounded-2xl border border-neutral-300/60 px-3 py-1.5 text-sm text-neutral-700 backdrop-blur-sm"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.54) 100%)",
        }}
      >
        {badgeLabel}:{" "}
        <span className="font-bold text-neutral-900">{badgeValue}</span>
      </div>

      {/* Chart fills the full width. maxBarSize caps how wide a single bar
          can grow — so 2 bars are wide and 5 bars are narrower, both filling
          the same total width naturally via Recharts' own layout. */}
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart
          id={uid}
          data={data}
          margin={{ top: 48, right: 0, left: 0, bottom: 0 }}
          maxBarSize={640}
          barCategoryGap="6.7%"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorTop} stopOpacity={1} />
              <stop offset="100%" stopColor={colorTop} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="date" hide />
          <YAxis hide domain={[0, 100]} />

          <Tooltip
          cursor={false}
          shared={false}
          wrapperStyle={{ zIndex: 100 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-md text-sm">
                  <p className="font-semibold text-neutral-700">{label}</p>
                  <p className="text-neutral-900 font-bold">{payload[0].value}%</p>
                </div>
              );
            }}
          />

          <Bar
            dataKey="score"
            fill={`url(#${gradientId})`}
            radius={[8, 8, 0, 0]}
            isAnimationActive
          activeBar={{ fillOpacity: 0.8 }}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}