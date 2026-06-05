
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
const features = [
  {
    Icon: ({ className }: { className?: string }) => (
      <img 
        src="/icons8/icons8-rescan-document-100.png" 
        alt="Rescan Document" 
        className={`${className} object-contain`} 
      />
    ),
    name: "Bereskan Data Kusam Tanpa Pusing",
    description: "Unggah data CSV atau Excel Anda, sedetail dan seberantakan apa pun itu. AI kami akan secara otomatis membersihkan, memetakan, dan merapikannya dalam hitungan detik. Tidak perlu lagi rekap manual sampai larut malam.",
    href: "#",
    cta: "Pelajari lebih lanjut",
    className: "col-span-7 lg:col-span-4",
    background: (
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center grayscale transition-all duration-300 ease-out group-hover:scale-105"
        style={{
          // Added a fallback dark color (#2c2c2c) in case the image fails to load
          background: `linear-gradient(90deg, #272727 0%, #2C2C2C 38.95%, rgba(51, 51, 51, 0.84) 100%), url('/carousel/Rectangle 63.webp') center/cover no-repeat, #2c2c2c`,
        }}
      />
    ),
  },
  {
    Icon: ({ className }: { className?: string }) => (
      <img 
        src="/icons8/icons8-graph-100.png" 
        alt="Graph" 
        className={`${className} object-contain`} 
      />
    ),
    name: "Prediksi Penjualan Masa Depan",
    description: "Jangan biarkan stok menumpuk atau kehabisan barang terlaris. Mesin analitik kami membaca pola penjualan masa lalu Anda untuk memprediksi produk apa yang akan laku keras di bulan depan.",
    href: "#",
    cta: "Pelajari lebih lanjut",
    className: "col-span-7 lg:col-span-3",
    background: (
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center grayscale transition-all duration-300 ease-out group-hover:scale-105"
        style={{
          background: `linear-gradient(90deg, #272727 0%, #2C2C2C 38.95%, rgba(45, 45, 45, 0.96) 53.37%, rgba(51, 51, 51, 0.84) 100%), url('/carousel/Rectangle 64.webp') center/cover no-repeat, #2c2c2c`,
        }}
      />
    ),
  },
  {
    Icon: ({ className }: { className?: string }) => (
      <img 
        src="/icons8/icons8-mind-map-100.png" 
        alt="Connected Graph" 
        className={`${className} object-contain`} 
      />
    ),
    name: "Ketahui Performa Produkmu",
    description: "Unggah data CSV atau Excel Anda, sedetail dan seberantakan apa pun itu. AI kami akan secara otomatis membersihkan, memetakan, dan merapikannya dalam hitungan detik. Tidak perlu lagi rekap manual sampai larut malam.",
    href: "#",
    cta: "Pelajari lebih lanjut",
    className: "col-span-7 lg:col-span-3",
    background: (
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center grayscale transition-all duration-300 ease-out group-hover:scale-105"
        style={{
          background: `linear-gradient(90deg, #272727 0%, #2C2C2C 38.95%, rgba(51, 51, 51, 0.84) 100%), url('/carousel/Rectangle 65.webp') center/cover no-repeat, #2c2c2c`,
        }}
      />
    ),
  },
  {
    Icon: ({ className }: { className?: string }) => (
      <img 
        src="/icons8/icons8-time24-100.png" 
        alt="24/7" 
        className={`${className} object-contain`} 
      />
    ),
    name: "Konsultan Bisnis Pribadi 24/7",
    description: "Ucapkan selamat tinggal pada grafik rumit yang sulit dipahami. Dapatkan insight dan rekomendasi langkah bisnis selanjutnya dalam bahasa manusia sehari-hari, langsung dari Asisten AI pintar kami.",
    href: "#",
    cta: "Pelajari lebih lanjut",
    className: "col-span-7 lg:col-span-4",
    background: (
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center grayscale transition-all duration-300 ease-out group-hover:scale-105"
        style={{
          background: `linear-gradient(90deg, #272727 0%, #2C2C2C 38.95%, rgba(51, 51, 51, 0.84) 100%), url('/carousel/Rectangle 66.webp') center/cover no-repeat, #2c2c2c`,
        }}
      />
    ),
  },
]

export function BentoFeature() {
  return (
    <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 md:px-8">
      {/* lg:grid-cols-3 paired with the col-span-1 and col-span-2 classes handles the sizing natively */}
      <BentoGrid className="lg:grid-cols-7">
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </div>
  )
}