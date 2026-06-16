'use client';

import { PerformanceBarChart } from "@/components/bar-chart";
import { DynamicDataTable, type AnalysisRow } from "@/components/customized/table/table-11";
import { StatusDonutChart } from "@/components/donut-chart";
import { AnalysisCard } from "@/components/main-card";
import { useAnalysis } from "@/hooks/use-analysis";
import { useEffect, useMemo } from "react";
import { AnalysisLoadingState } from "@/components/analysis-loading-state";
import { AnalysisEmptyState } from "@/components/analysis-empty-state";
import { Clock } from "lucide-react";

export default function History() {
    const { historyData, isLoadingHistory: isLoading, fetchHistory } = useAnalysis();

    useEffect(() => {
      fetchHistory();
    }, [fetchHistory]);

    // Mengubah riwayat data mentah menjadi data tren untuk Forecasting
    const forecastingData = useMemo(() => {
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
    const clusteringData = useMemo(() => {
      return historyData
        .filter((d) => d.metode.toLowerCase() === "clustering" && d.status === "berhasil" && d.silhouette_score != null)
        .slice(0, 10)
        .reverse()
        .map((d) => ({
          date: d.tanggal.split(' ').slice(0, 2).join(' ').replace(',', ''),
          score: Math.round((d.silhouette_score as number) * 100),
        }));
    }, [historyData]);

    const forecastingMean = useMemo(() => {
      if (!forecastingData.length) return "0%";
      return Math.round(forecastingData.reduce((acc, curr) => acc + curr.score, 0) / forecastingData.length) + "%";
    }, [forecastingData]);

    const clusteringMean = useMemo(() => {
      if (!clusteringData.length) return "0%";
      return Math.round(clusteringData.reduce((acc, curr) => acc + curr.score, 0) / clusteringData.length) + "%";
    }, [clusteringData]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full w-full p-4 pt-12">
                <AnalysisLoadingState
                    title="Memuat riwayat analisis..."
                    subtitle="Proses ini mungkin memerlukan waktu beberapa saat"
                />
            </div>
        );
    }

    if (historyData.length === 0) {
        return (
            <div className="flex flex-col h-full w-full p-4">
                <AnalysisEmptyState
                    title="ditampilkan (Riwayat Analisis)"
                    description="Belum ada riwayat pengajuan analisis yang tersimpan di database."
                    steps={[
                        'Buka halaman Analisis untuk mengunggah file CSV baru.',
                        'Tentukan konfigurasi kolom dan jalankan analisis forecasting atau clustering.',
                        'Setelah analisis selesai, riwayat pengajuan dan performa model akan tercatat di halaman ini.'
                    ]}
                    icon={Clock}
                    redirectTo="/analisis"
                    buttonText="Mulai Analisis Pertama"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full flex-1 gap-4 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0 h-auto lg:h-[38%] xl:h-[36%] 2xl:h-[34%] lg:min-h-[260px] min-h-0">
              <AnalysisCard title={"Performa Historis Forecasting"} className="w-full h-[280px] lg:h-full min-h-0">
                  <div className="flex h-full w-full">
                      <PerformanceBarChart 
                        type="forecasting"
                        data={forecastingData}
                        badgeLabel="Mean Confidence"
                        badgeValue={forecastingMean}
                      />
                  </div>
              </AnalysisCard>
              <AnalysisCard title={"Performa Historis Clustering"} className="w-full h-[280px] lg:h-full min-h-0">
                  <div className="flex h-full w-full">
                      <PerformanceBarChart 
                        type="clustering"
                        data={clusteringData}
                        badgeLabel="Mean Silhouette"
                        badgeValue={clusteringMean}
                      />
                  </div>
              </AnalysisCard>
              <AnalysisCard title={"Rangkuman Status Pengajuan"} className="w-full h-[280px] lg:h-full min-h-0">
                  <div className="flex h-full w-full flex-col pb-4">
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