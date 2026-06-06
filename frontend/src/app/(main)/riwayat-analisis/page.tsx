import { DynamicDataTable, type AnalysisRow } from "@/components/customized/table/table-11";
import { AnalysisCard } from "@/components/main-card";

const dummyData: AnalysisRow[] = [
  {
    id: "1",
    dataset: "sales_q1_2026.csv",
    tanggal: "Apr 30, 2026",
    metode: "Forecasting",
    status: "berhasil",
    insight: "Terdapat tren kenaikan penjualan 15% untuk kategori elektronik di bulan depan.",
  },
  {
    id: "2",
    dataset: "customer_segmentation_v2.csv",
    tanggal: "May 02, 2026",
    metode: "Clustering",
    status: "berjalan",
    insight: "Sedang memproses pengelompokan berdasarkan tingkat frekuensi dan nilai transaksi...",
  },
  {
    id: "3",
    dataset: "promo_campaign_2025.csv",
    tanggal: "May 10, 2026",
    metode: "Classification",
    status: "gagal",
    insight: "Kolom target tidak ditemukan dalam dataset. Harap periksa kembali konfigurasi data.",
  },
  {
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },
  {
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },
  {
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },
  {
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },
  {
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },
  {
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },{
    id: "4",
    dataset: "inventory_june_batch.csv",
    tanggal: "Jun 01, 2026",
    metode: "Forecasting",
    status: "menunggu",
    insight: "Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.",
  },
  {
    id: "5",
    dataset: "user_feedback_nlp.csv",
    tanggal: "Jun 05, 2026",
    metode: "Clustering",
    status: "berhasil",
    insight: "Ditemukan 3 kelompok utama pelanggan dengan pola keluhan yang sama pada pengiriman.",
  }
];

export default function History() {
    return (
        <div className="flex flex-col h-full flex-1 gap-3 min-h-0">
        <div className="flex gap-3 h-fit shrink-0">
            <AnalysisCard title={"Performa Historis Forecasting"} className="w-full min-h-76">
                a
            </AnalysisCard>
            <AnalysisCard title={"Performa Historis Forecasting"} className="w-full min-h-76">
                a
            </AnalysisCard>
            <AnalysisCard title={"Performa Historis Forecasting"} className="w-full min-h-76">
                a
            </AnalysisCard>

        </div>
        <div className="flex-1 min-h-0 w-full">
            <DynamicDataTable data={dummyData} />
        </div>
        </div>
    )
}