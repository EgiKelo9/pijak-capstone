'use client';

import { PerformanceBarChart } from "@/components/bar-chart";
import { DynamicDataTable, type AnalysisRow } from "@/components/customized/table/table-11";
import { StatusDonutChart } from "@/components/donut-chart";
import { AnalysisCard } from "@/components/main-card";
import { getAnalysisHistory } from "@/lib/middle-man";
import * as React from "react";

export default function History() {
    const [historyData, setHistoryData] = React.useState<AnalysisRow[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const fetchHistory = async () => {
        try {
          const data = await getAnalysisHistory();
          if (data) {
            setHistoryData(data);
          }
        } catch (error) {
          console.error("Failed to fetch analysis history:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchHistory();
    }, []);

    // Mengubah riwayat data mentah menjadi data tren untuk Forecasting
    const forecastingData = React.useMemo(() => {
      return historyData
        .filter((d) => d.metode.toLowerCase() === "forecasting" && d.status === "berhasil" && d.confidence_level != null)
        .slice(0, 10) // Ambil 10 data terbaru
        .reverse() // Balik agar urutannya kronologis di chart
        .map((d) => ({
          date: d.tanggal.split(' ').slice(0, 2).join(' ').replace(',', ''), // "Mon DD, YYYY" -> "Mon DD"
          score: Math.round((d.confidence_level as number) * 100),
        }));
    }, [historyData]);

    // Mengubah riwayat data mentah menjadi data tren untuk Clustering
    const clusteringData = React.useMemo(() => {
      return historyData
        .filter((d) => d.metode.toLowerCase() === "clustering" && d.status === "berhasil" && d.silhouette_score != null)
        .slice(0, 10)
        .reverse()
        .map((d) => ({
          date: d.tanggal.split(' ').slice(0, 2).join(' ').replace(',', ''),
          score: Math.round((d.silhouette_score as number) * 100),
        }));
    }, [historyData]);

    const forecastingMean = React.useMemo(() => {
      if (!forecastingData.length) return "0%";
      return Math.round(forecastingData.reduce((acc, curr) => acc + curr.score, 0) / forecastingData.length) + "%";
    }, [forecastingData]);

    const clusteringMean = React.useMemo(() => {
      if (!clusteringData.length) return "0%";
      return Math.round(clusteringData.reduce((acc, curr) => acc + curr.score, 0) / clusteringData.length) + "%";
    }, [clusteringData]);

    return (
        <div className="flex flex-col h-full flex-1 gap-3 min-h-0">
        <div className="flex gap-3 h-fit shrink-0">
            <AnalysisCard title={"Performa Historis Forecasting"} className="w-full min-h-76">
                <div className="flex h-full w-full">
                    <PerformanceBarChart 
                      type="forecasting"
                      data={forecastingData}
                      badgeLabel="Mean Confidence"
                      badgeValue={forecastingMean}
                    />
                </div>
            </AnalysisCard>
            <AnalysisCard title={"Performa Historis Clustering"} className="w-full min-h-76">
                <div className="flex h-full w-full">
                    <PerformanceBarChart 
                      type="clustering"
                      data={clusteringData}
                      badgeLabel="Mean Silhouette"
                      badgeValue={clusteringMean}
                    />
                </div>
            </AnalysisCard>
            <AnalysisCard title={"Rangkuman Status Pengajuan"} className="w-full min-h-76">
                <div className="flex h-full w-full flex-col pt-2">
                    <StatusDonutChart data={historyData} />
                </div>
            </AnalysisCard>

        </div>
        <div className="flex-1 min-h-0 w-full">
            <DynamicDataTable data={historyData} />
        </div>
        </div>
    )
}