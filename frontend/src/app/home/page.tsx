// app/page.tsx
import ButtonUpgradeDemo from "@/components/shadcn-space/button/button-02";
import { IconSparklesFilled } from "@tabler/icons-react";
import HeroBackground from "./heroBg"
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <main className="w-full text-foreground">
      <section className="relative w-full min-h-screen flex flex-col">
        <HeroBackground />

        <div className="relative z-10 flex flex-col flex-grow">

          <div className="flex flex-col items-center justify-center flex-grow text-center px-3 mx-auto gap-2">
            {/* Title */}
            <Badge icon={<IconSparklesFilled className="h-4 font-bold text-primary"/>} className="text-xs mb-3">Kecerdasan Bisnis Berbasis-AI</Badge>
            <h1 className="text-5xl md:text-8xl font-semibold">
              Kelola Bisnis Makin <span className="inline-block bg-gradient-to-b from-[#90FDF2] to-primary bg-clip-text text-transparent">eZ</span>
            </h1>
            {/* Substitle */}
            <p className="text-sm md:text-xl font-light max-w-3xl">
              Ambil keputusan bisnis berdasarkan analisa berbasis data, serta insight bisnis berbasis kecerdasan buatan — sehingga anda selalu selangkah lebih maju
            </p>

            {/* Todo: CTA */}
            <div className="mt-6">
                <ButtonUpgradeDemo/>
            </div>

            {/* Todo: Preview Cara Kerja */}
          </div>

        </div>

      </section>

      <section id="features" className="min-h-screen">
        Coba
      </section>

    </main>
  );
}