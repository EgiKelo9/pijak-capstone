'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/animate/tabs";
import { AnalysisCard } from "@/components/main-card";
import { Cpu, TrendingUp } from "lucide-react";
import { useState } from "react";
import ChatBot, { ChatBotProps } from "./chatbot";

export default function MainDashboar() {

    const mockReceived: ChatBotProps[] = [
        // --- CLUSTERING FLOW ---
        {
            ChatMessages: "Halo! Saya **BeeZ**, asisten AI Anda. Ada yang bisa saya bantu terkait analisis segmentasi (clustering) hari ini?",
            ChatRole: "assistant",
            Model: "Clustering"
        },
        {
            ChatMessages: "Tolong analisis dataset penjualan saya, saya ingin tahu segmentasi produk berdasarkan tingkat penjualannya.",
            ChatRole: "user",
            Model: "Clustering"
        },
        {
            ChatMessages: "Tentu! Berdasarkan **Analisis Clustering** menggunakan algoritma K-Means, saya telah membagi produk Anda menjadi 3 kelompok utama:\n\n1. **Cluster 0 (Produk Bintang)**: Penjualan tinggi, profit margin besar. (Contoh: *Produk A, Produk D*)\n2. **Cluster 1 (Produk Stabil)**: Penjualan stabil namun profit moderat.\n3. **Cluster 2 (Produk Lambat)**: Penjualan lambat, stok menumpuk. (Contoh: *Produk C, Produk F*)\n\nApakah Anda ingin melihat rekomendasi strategi untuk salah satu cluster di atas?",
            ChatRole: "assistant",
            Model: "Clustering"
        },
        {
            ChatMessages: "Apa rekomendasi strategi yang bagus untuk produk di Cluster 2 agar stoknya cepat habis?",
            ChatRole: "user",
            Model: "Clustering"
        },
        {
            ChatMessages: "Berikut adalah beberapa rekomendasi strategi untuk **Cluster 2 (Produk Lambat)**:\n\n* **Bundling Promo**: Gabungkan produk ini dengan produk dari *Cluster 0* dengan harga diskon.\n* **Flash Sale**: Adakan diskon besar-besaran dalam waktu singkat untuk menghabiskan sisa stok.\n* **Evaluasi Restock**: Kurangi atau hentikan pemesanan ulang untuk produk-produk di kategori ini bulan depan.\n\nPerlu saya rincikan produk apa saja yang masuk ke dalam list promo?",
            ChatRole: "assistant",
            Model: "Clustering"
        },

        // --- FORECASTING FLOW ---
        {
            ChatMessages: "Halo! Saya **BeeZ**. Apakah Anda ingin memprediksi tren penjualan bulan depan?",
            ChatRole: "assistant",
            Model: "Forecasting"
        },
        {
            ChatMessages: "Ya, tolong buatkan forecasting untuk produk kategori Elektronik berdasarkan data 2 tahun terakhir.",
            ChatRole: "user",
            Model: "Forecasting"
        },
        {
            ChatMessages: "Memproses data historis... Selesai!\n\nBerikut adalah hasil **Forecasting Penjualan** untuk kategori Elektronik 3 bulan ke depan:\n\n### Ringkasan Prediksi\n- **Bulan 1**: Diproyeksikan naik **12.5%** (Estimasi: 1.250 unit)\n- **Bulan 2**: Stabil di kisaran **1.200 unit**\n- **Bulan 3**: Lonjakan **25%** (Estimasi: 1.500 unit) mendekati musim liburan.\n\nSecara keseluruhan, tren menunjukkan **pertumbuhan positif**.",
            ChatRole: "assistant",
            Model: "Forecasting"
        },
        {
            ChatMessages: "Menarik, apakah ada tren musiman tertentu yang perlu saya perhatikan dari data tersebut?",
            ChatRole: "user",
            Model: "Forecasting"
        },
        {
            ChatMessages: "Tentu. Sistem mendeteksi adanya **Pola Musiman (Seasonality)** yang kuat:\n\n1. **Puncak Penjualan (Peak Season)**: Terjadi setiap bulan November dan Desember. Persiapkan stok minimal 1.5 bulan sebelumnya.\n2. **Penurunan (Low Season)**: Terjadi di bulan Februari dan Maret. Sebaiknya kurangi budget marketing pada periode ini dan fokus pada retensi pelanggan lama.\n\nApakah Anda ingin saya menyimpan laporan metrik ini?",
            ChatRole: "assistant",
            Model: "Forecasting"
         },
        {
            ChatMessages: "Boleh, tolong simpan laporannya ya.",
            ChatRole: "user",
            Model: "Forecasting"
        }
    ];

    const [ClusteringChats, setClusteringChats] = useState<ChatBotProps[]>(mockReceived.filter(chat => chat.Model === "Clustering"));
    const [ForecastingChats, setForecastingChats] = useState<ChatBotProps[]>(mockReceived.filter(chat => chat.Model === "Forecasting"));

    const [activeTab, setActiveTab] = useState<'forecasting' | 'clustering'>('forecasting')

    return (
        <>
        {/* Main Container */}
        <div className="flex gap-4 w-full h-full">
            {/* Left */}
            <div className="flex flex-col gap-4 w-full h-full">
                <div className="flex gap-4 w-full h-full">
                    <AnalysisCard title={"Visualisasi Cluster"} className="w-full">
                        TODO: Scatter Plot, i think
                    </AnalysisCard>
                    
                    <AnalysisCard title={"Analisis Produk"} className="w-full">
                        TODO: Simple Table
                    </AnalysisCard>
                </div>

                <AnalysisCard title={"Visualisasi Forecasting"} className="w-full h-full">
                    TODO: Line Chart
                </AnalysisCard>

            </div>
            {/* Right */}
            <aside className="w-[33vw] md:w-[48vw]">
                <AnalysisCard
                    title="Tanya BeeZ AI"
                    className="h-full w-full"
                    innerClassName="flex flex-col p-1.51 pt-0  gap-2 relative group/chat overflow-hidden"
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
                        forceMount
                        className={[
                            'absolute inset-0 transition-opacity duration-300',
                            activeTab === 'forecasting'
                            ? 'opacity-100 pointer-events-auto z-10'
                            : 'opacity-0 pointer-events-none z-0',
                        ].join(' ')}
                        >
                            <ChatBot chats={ForecastingChats} />
                        </TabsContent>
            
                        {/* Clustering panel */}
                        <TabsContent
                        value="clustering"
                        forceMount
                        className={[
                            'absolute inset-0 transition-opacity duration-300',
                            activeTab === 'clustering'
                            ? 'opacity-100 pointer-events-auto z-10'
                            : 'opacity-0 pointer-events-none z-0',
                        ].join(' ')}
                        >
                            <ChatBot chats={ClusteringChats} />
                        </TabsContent>
            
                    </div>
                    </Tabs>
                </AnalysisCard>
            </aside>
        </div>
        </>
    )
}