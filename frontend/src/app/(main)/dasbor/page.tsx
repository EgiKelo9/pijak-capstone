'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/animate/tabs";
import { AnalysisCard } from "@/components/main-card";
import { useClustering } from "@/hooks/use-clustering";
import { useForecasting } from "@/hooks/use-forecasting";
import { ClusterScatterChart } from "@/components/main/clustering/cluster-scatter-chart";
import { ProductTable } from "@/components/main/clustering/product-table";
import { ForecastingChart } from "@/components/main/forecasting/forecasting-chart";
import { Cpu, TrendingUp, Loader2, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";
import { AnalysisLoadingState } from "@/components/analysis-loading-state";
import { AnalysisEmptyState } from "@/components/analysis-empty-state";
import ChatBot, { ChatBotProps } from "@/components/main/dasbor/chatbot";
import { sendChatbotMessage, getChatbotHistory } from "@/services/chatbot";
import { getDatasetContext } from "@/hooks/use-analysis";
import { getCleanedDatasetIds } from "@/services/analysis";
import { AttachedType, TargetTask } from "@/types";

export default function MainDashboard() {
  const {
    result: clusteringResult,
    colFitur: clusteringColFitur,
    isLoading: isLoadingClustering,
    error: errorClustering,
    analysisId: clusteringAnalysisId,
  } = useClustering();

  const {
    data: forecastData,
    timeFilter,
    setTimeFilter,
    isLoading: isLoadingForecasting,
    error: errorForecasting,
    analysisId: forecastingAnalysisId,
  } = useForecasting();

  const mockReceived: ChatBotProps[] = [
    // --- CLUSTERING FLOW ---
    {
      ChatMessages: "Halo! Saya **BeeZ**, asisten AI Anda. Ada yang bisa saya bantu terkait analisis segmentasi (clustering) hari ini?",
      ChatRole: "assistant",
      Model: "Clustering"
    },
    // {
    //     ChatMessages: "Tolong analisis dataset penjualan saya, saya ingin tahu segmentasi produk berdasarkan tingkat penjualannya.",
    //     ChatRole: "user",
    //     Model: "Clustering"
    // },
    // {
    //     ChatMessages: "Tentu! Berdasarkan **Analisis Clustering** menggunakan algoritma K-Means, saya telah membagi produk Anda menjadi 3 kelompok utama:\n\n1. **Cluster 0 (Produk Bintang)**: Penjualan tinggi, profit margin besar. (Contoh: *Produk A, Produk D*)\n2. **Cluster 1 (Produk Stabil)**: Penjualan stabil namun profit moderat.\n3. **Cluster 2 (Produk Lambat)**: Penjualan lambat, stok menumpuk. (Contoh: *Produk C, Produk F*)\n\nApakah Anda ingin melihat rekomendasi strategi untuk salah satu cluster di atas?",
    //     ChatRole: "assistant",
    //     Model: "Clustering"
    // },
    // {
    //     ChatMessages: "Apa rekomendasi strategi yang bagus untuk produk di Cluster 2 agar stoknya cepat habis?",
    //     ChatRole: "user",
    //     Model: "Clustering"
    // },
    // {
    //     ChatMessages: "Berikut adalah beberapa rekomendasi strategi untuk **Cluster 2 (Produk Lambat)**:\n\n* **Bundling Promo**: Gabungkan produk ini dengan produk dari *Cluster 0* dengan harga diskon.\n* **Flash Sale**: Adakan diskon besar-besaran dalam waktu singkat untuk menghabiskan sisa stok.\n* **Evaluasi Restock**: Kurangi atau hentikan pemesanan ulang untuk produk-produk di kategori ini bulan depan.\n\nPerlu saya rincikan produk apa saja yang masuk ke dalam list promo?",
    //     ChatRole: "assistant",
    //     Model: "Clustering"
    // },

    // --- FORECASTING FLOW ---
    {
      ChatMessages: "Halo! Saya **BeeZ**. Apakah Anda ingin memprediksi tren penjualan bulan depan?",
      ChatRole: "assistant",
      Model: "Forecasting"
    },
    // {
    //     ChatMessages: "Ya, tolong buatkan forecasting untuk produk kategori Elektronik berdasarkan data 2 tahun terakhir.",
    //     ChatRole: "user",
    //     Model: "Forecasting"
    // },
    // {
    //     ChatMessages: "Memproses data historis... Selesai!\n\nBerikut adalah hasil **Forecasting Penjualan** untuk kategori Elektronik 3 bulan ke depan:\n\n### Ringkasan Prediksi\n- **Bulan 1**: Diproyeksikan naik **12.5%** (Estimasi: 1.250 unit)\n- **Bulan 2**: Stabil di kisaran **1.200 unit**\n- **Bulan 3**: Lonjakan **25%** (Estimasi: 1.500 unit) mendekati musim liburan.\n\nSecara keseluruhan, tren menunjukkan **pertumbuhan positif**.",
    //     ChatRole: "assistant",
    //     Model: "Forecasting"
    // },
    // {
    //     ChatMessages: "Menarik, apakah ada tren musiman tertentu yang perlu saya perhatikan dari data tersebut?",
    //     ChatRole: "user",
    //     Model: "Forecasting"
    // },
    // {
    //     ChatMessages: "Tentu. Sistem mendeteksi adanya **Pola Musiman (Seasonality)** yang kuat:\n\n1. **Puncak Penjualan (Peak Season)**: Terjadi setiap bulan November dan Desember. Persiapkan stok minimal 1.5 bulan sebelumnya.\n2. **Penurunan (Low Season)**: Terjadi di bulan Februari dan Maret. Sebaiknya kurangi budget marketing pada periode ini dan fokus pada retensi pelanggan lama.\n\nApakah Anda ingin saya menyimpan laporan metrik ini?",
    //     ChatRole: "assistant",
    //     Model: "Forecasting"
    //  },
    // {
    //     ChatMessages: "Boleh, tolong simpan laporannya ya.",
    //     ChatRole: "user",
    //     Model: "Forecasting"
    // }
  ];

  const [ClusteringChats, setClusteringChats] = useState<ChatBotProps[]>(mockReceived.filter(chat => chat.Model === "Clustering"));
  const [ForecastingChats, setForecastingChats] = useState<ChatBotProps[]>(mockReceived.filter(chat => chat.Model === "Forecasting"));

  const [activeTab, setActiveTab] = useState<TargetTask>('forecasting')
  const [isForecastingChatLoading, setIsForecastingChatLoading] = useState(false);
  const [isClusteringChatLoading, setIsClusteringChatLoading] = useState(false);

  useEffect(() => {
    if (!forecastingAnalysisId) {
      setForecastingChats([
        {
          ChatMessages: "Halo! Saya **BeeZ**. Apakah Anda ingin memprediksi tren penjualan bulan depan?",
          ChatRole: "assistant",
          Model: "Forecasting"
        }
      ]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const history = await getChatbotHistory(forecastingAnalysisId);
        const initialGreeting: ChatBotProps = {
          ChatMessages: "Halo! Saya **BeeZ**. Apakah Anda ingin memprediksi tren penjualan bulan depan?",
          ChatRole: "assistant",
          Model: "Forecasting"
        };
        const chatHistory = history.map(h => ({
          ChatMessages: h.message,
          ChatRole: h.role,
          Model: "Forecasting"
        }));
        setForecastingChats([initialGreeting, ...chatHistory]);
      } catch (err) {
        console.error("Gagal memuat histori chatbot forecasting:", err);
      }
    };

    fetchHistory();
  }, [forecastingAnalysisId]);

  useEffect(() => {
    if (!clusteringAnalysisId) {
      setClusteringChats([
        {
          ChatMessages: "Halo! Saya **BeeZ**, asisten AI Anda. Ada yang bisa saya bantu terkait analisis segmentasi (clustering) hari ini?",
          ChatRole: "assistant",
          Model: "Clustering"
        }
      ]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const history = await getChatbotHistory(clusteringAnalysisId);
        const initialGreeting: ChatBotProps = {
          ChatMessages: "Halo! Saya **BeeZ**, asisten AI Anda. Ada yang bisa saya bantu terkait analisis segmentasi (clustering) hari ini?",
          ChatRole: "assistant",
          Model: "Clustering"
        };
        const chatHistory = history.map(h => ({
          ChatMessages: h.message,
          ChatRole: h.role,
          Model: "Clustering"
        }));
        setClusteringChats([initialGreeting, ...chatHistory]);
      } catch (err) {
        console.error("Gagal memuat histori chatbot clustering:", err);
      }
    };

    fetchHistory();
  }, [clusteringAnalysisId]);

  const handleSendMessage = async (
    message: string,
    attachedType: AttachedType
  ) => {
    if (!message.trim()) return;

    const targetTask = activeTab;

    const newUserChat: ChatBotProps = {
      ChatMessages: message,
      ChatRole: 'user',
      Model: targetTask === 'forecasting' ? 'Forecasting' : 'Clustering'
    };

    if (targetTask === 'forecasting') {
      setForecastingChats(prev => [...prev, newUserChat]);
      setIsForecastingChatLoading(true);
    } else {
      setClusteringChats(prev => [...prev, newUserChat]);
      setIsClusteringChatLoading(true);
    }

    // Send a lightweight indicator instead of the huge raw JSON/CSV data.
    // The backend will automatically fetch the complete summary context from the database.
    let attachment: any = null;
    if (attachedType) {
      attachment = { attached_type: attachedType };
    }

    let taskId = 'unknown';
    if (targetTask === 'forecasting') {
      if (forecastingAnalysisId) {
        taskId = forecastingAnalysisId.toString();
      } else {
        const context = getDatasetContext();
        if (context?.forecast_config) {
          taskId = context.forecast_config.dataset_id?.toString() || 'unknown';
        }
      }
    } else {
      if (clusteringAnalysisId) {
        taskId = clusteringAnalysisId.toString();
      } else if ((clusteringResult as any)?.analysis_id) {
        taskId = (clusteringResult as any).analysis_id.toString();
      } else {
        const context = getDatasetContext();
        if (context?.raw_dataset_id) {
          try {
            const { clustering } = await getCleanedDatasetIds(context.raw_dataset_id);
            taskId = clustering?.toString() || 'unknown';
          } catch (err) {
            console.error("Failed to fetch cleaned clustering ID for chatbot:", err);
          }
        }
      }
    }

    try {
      const response = await sendChatbotMessage(targetTask, {
        task_id: taskId,
        message,
        attachment
      });

      const newAssistantChat: ChatBotProps = {
        ChatMessages: response.message,
        ChatRole: 'assistant',
        Model: targetTask === 'forecasting' ? 'Forecasting' : 'Clustering'
      };

      if (targetTask === 'forecasting') {
        setForecastingChats(prev => [...prev, newAssistantChat]);
      } else {
        setClusteringChats(prev => [...prev, newAssistantChat]);
      }
    } catch (error: any) {
      console.error('Error sending chatbot message:', error);
      const errorChat: ChatBotProps = {
        ChatMessages: `Maaf, terjadi kesalahan saat menghubungi BeeZ AI: ${error.response?.data?.message || error.message || 'Error'}`,
        ChatRole: 'assistant',
        Model: targetTask === 'forecasting' ? 'Forecasting' : 'Clustering'
      };
      if (targetTask === 'forecasting') {
        setForecastingChats(prev => [...prev, errorChat]);
      } else {
        setClusteringChats(prev => [...prev, errorChat]);
      }
    } finally {
      if (targetTask === 'forecasting') {
        setIsForecastingChatLoading(false);
      } else {
        setIsClusteringChatLoading(false);
      }
    }
  };

  // Determine status for clustering cards
  const clusteringStatus = isLoadingClustering
    ? 'menunggu'
    : errorClustering
      ? 'gagal'
      : !clusteringResult
        ? 'kosong'
        : 'berhasil';

  if (isLoadingClustering || isLoadingForecasting) {
    return (
      <div className="flex flex-col h-full w-full p-4 pt-12">
        <AnalysisLoadingState
          title="Memuat data dasbor..."
          subtitle="Proses ini mungkin memerlukan waktu beberapa saat"
        />
      </div>
    );
  }

  if (!clusteringResult && !forecastData) {
    return (
      <div className="flex flex-col h-full w-full p-4">
        <AnalysisEmptyState
          title="dianalisis (Dasbor)"
          description="Belum ada data analisis cluster maupun forecasting yang tersedia. Silakan jalankan analisis terlebih dahulu."
          steps={[
            'Buka halaman Analisis untuk mengunggah file CSV data penjualan.',
            'Tentukan konfigurasi kolom dan jalankan analisis forecasting atau clustering.',
            'Kembali ke halaman Dasbor untuk melihat visualisasi hasil analisis dan berkonsultasi dengan BeeZ AI.'
          ]}
          icon={LayoutGrid}
          redirectTo="/analisis"
          buttonText="Mulai Analisis"
        />
      </div>
    );
  }

  return (
    <>
      {/* Main Container */}
      <div className="flex gap-4 w-full h-full p-4 overflow-hidden">
        {/* Left */}
        <div className="flex flex-col gap-4 flex-1 h-full max-h-[85vh] overflow-y-auto pr-2 pb-6">
          <div className="flex flex-col gap-4 w-full shrink-0">
            <AnalysisCard title={"Visualisasi Cluster"} className="h-auto" status={clusteringStatus}>
              {isLoadingClustering ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-neutral-500">
                  <Loader2 className="size-6 animate-spin text-[#2BBAEE]" />
                  <span className="text-xs">Memuat visualisasi cluster...</span>
                </div>
              ) : errorClustering ? (
                <div className="text-rose-500 text-xs py-20 text-center">
                  Gagal memuat data: {errorClustering}
                </div>
              ) : !clusteringResult ? (
                <div className="text-neutral-400 text-xs py-20 text-center">
                  Belum ada data analisis cluster. Silakan jalankan analisis di halaman Clustering.
                </div>
              ) : (
                <ClusterScatterChart result={clusteringResult} colFitur={clusteringColFitur} />
              )}
            </AnalysisCard>

            {isLoadingForecasting ? (
              <AnalysisCard title="Visualisasi Forecasting" className="w-full" status="menunggu">
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-neutral-500">
                  <Loader2 className="size-6 animate-spin text-[#f59e0b]" />
                  <span className="text-xs">Memuat visualisasi forecasting...</span>
                </div>
              </AnalysisCard>
            ) : errorForecasting ? (
              <AnalysisCard title="Visualisasi Forecasting" className="w-full" status="gagal">
                <div className="text-rose-500 text-xs py-20 text-center">
                  Gagal memuat data: {errorForecasting}
                </div>
              </AnalysisCard>
            ) : !forecastData ? (
              <AnalysisCard title="Visualisasi Forecasting" className="w-full" status="kosong">
                <div className="text-neutral-400 text-xs py-20 text-center">
                  Belum ada data forecasting. Silakan jalankan analisis di halaman Forecasting.
                </div>
              </AnalysisCard>
            ) : (
              <ForecastingChart
                data={forecastData.trend_data}
                timeFilter="weekly"
                setTimeFilter={() => { }}
                isFixedFilter={true}
                hideFilterButtons={true}
              />
            )}

            <AnalysisCard title={"Analisis Produk"} className="h-auto" status={clusteringStatus}>
              {isLoadingClustering ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-neutral-500">
                  <Loader2 className="size-6 animate-spin text-[#2BBAEE]" />
                  <span className="text-xs">Memuat analisis produk...</span>
                </div>
              ) : errorClustering ? (
                <div className="text-rose-500 text-xs py-20 text-center">
                  Gagal memuat data: {errorClustering}
                </div>
              ) : !clusteringResult ? (
                <div className="text-neutral-400 text-xs py-20 text-center">
                  Belum ada data analisis produk. Silakan jalankan analisis di halaman Clustering.
                </div>
              ) : (
                <ProductTable data={clusteringResult.cluster_data} colFitur={clusteringColFitur} />
              )}
            </AnalysisCard>
          </div>
        </div>
        {/* Right */}
        <aside className="w-[24vw] h-full max-h-[85vh] shrink-0">
          <AnalysisCard
            title="Tanya BeeZ AI"
            className="h-full w-full"
            innerClassName="flex flex-col p-1.51 pt-0 gap-2 relative group/chat overflow-hidden"
          >
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'forecasting' | 'clustering')}
              className="flex flex-col flex-1 min-h-0 w-full"
            >
              <div className="absolute top-3 inset-x-0 z-20 flex justify-center opacity-0 -translate-y-1 pointer-events-none group-hover/chat:opacity-100 group-hover/chat:translate-y-0 group-hover/chat:pointer-events-auto transition-all duration-300 ease-out">
                <TabsList className="shadow-md backdrop-blur-md bg-white/85 border border-neutral-200/60 gap-1 p-1">
                  <TabsTrigger
                    value="forecasting"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <TrendingUp className="size-3" />
                    Forecasting
                  </TabsTrigger>
                  <TabsTrigger
                    value="clustering"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Cpu className="size-3" />
                    Clustering
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="relative flex-1 min-h-0 w-full">
                {/* Forecasting panel */}
                <TabsContent
                  value="forecasting"
                  className={[
                    'absolute inset-0 transition-opacity duration-300',
                    activeTab === 'forecasting'
                      ? 'opacity-100 pointer-events-auto z-10'
                      : 'opacity-0 pointer-events-none z-0',
                  ].join(' ')}
                >
                  <ChatBot
                    chats={ForecastingChats}
                    onSendMessage={handleSendMessage}
                    isLoading={isForecastingChatLoading}
                  />
                </TabsContent>

                {/* Clustering panel */}
                <TabsContent
                  value="clustering"
                  className={[
                    'absolute inset-0 transition-opacity duration-300',
                    activeTab === 'clustering'
                      ? 'opacity-100 pointer-events-auto z-10'
                      : 'opacity-0 pointer-events-none z-0',
                  ].join(' ')}
                >
                  <ChatBot
                    chats={ClusteringChats}
                    onSendMessage={handleSendMessage}
                    isLoading={isClusteringChatLoading}
                  />
                </TabsContent>

              </div>
            </Tabs>
          </AnalysisCard>
        </aside>
      </div>
    </>
  )
}