"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

// Tipe data berdasarkan data tabel Anda
export interface HistoryRow {
  id: string;
  dataset: string;
  tanggal: string;
  metode: string;
  status: string;
  insight: string;
}

interface StatusDonutChartProps {
  data: HistoryRow[];
}

const chartConfig = {
  count: { label: "Total" },
  berhasil: { label: "Berhasil", color: "#2BBAEE" },
  gagal: { label: "Gagal", color: "#D1D5DB" },
  menunggu: { label: "Menunggu", color: "#90FDF2" },
} satisfies ChartConfig

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  
  // 1. Mengolah array data mentah menjadi jumlah hitungan untuk Chart
  const chartData = React.useMemo(() => {
    let berhasil = 0;
    let gagal = 0;
    let menunggu = 0;

    data.forEach((row) => {
      const status = row.status.toLowerCase();
      if (status === "berhasil") berhasil += 1;
      else if (status === "gagal") gagal += 1;
      // Jika statusnya "berjalan" atau "menunggu", masukkan ke kategori menunggu
      else menunggu += 1; 
    });

    // Kembalikan array. Kita filter(count > 0) agar status yang bernilai 0
    // tidak memunculkan garis kosong di chart.
    return [
      { status: "berhasil", count: berhasil, fill: "var(--color-berhasil)" },
      { status: "gagal", count: gagal, fill: "var(--color-gagal)" },
      { status: "menunggu", count: menunggu, fill: "var(--color-menunggu)" },
    ].filter(item => item.count > 0);
  }, [data]);

  // 2. Hitung total keseluruhan untuk tulisan di tengah Donat
  const totalAnalisis = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square w-full max-h-[220px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
      >
        <PieChart>
          <ChartTooltip 
            cursor={false} 
            content={<ChartTooltipContent hideLabel />} 
          />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            // FIX KETEBALAN: innerRadius diturunkan ke 60 agar donatnya lebih tebal (seperti di docs).
            // Jika masih kurang tebal, turunkan lagi ke 50.
            innerRadius={56} 
            strokeWidth={6}
            stroke="white"
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-neutral-800 text-4xl font-bold"
                      >
                        {totalAnalisis.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-neutral-500 text-xs font-medium"
                      >
                        Analisis
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      {/* Custom Legend Sesuai Desain Figma */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-500">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-[#2BBAEE]" />
          <span>Berhasil</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-[#D1D5DB]" />
          <span>Gagal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-[#90FDF2]" />
          <span>Menunggu</span>
        </div>
      </div>
    </div>
  )
}