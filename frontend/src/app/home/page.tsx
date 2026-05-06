// app/page.tsx
import ButtonUpgradeDemo from "@/components/shadcn-space/button/button-02";
import { Badge } from "@/components/ui/badge";
import { IconSparklesFilled } from "@tabler/icons-react";
import { AboutBackground, HeroBackground } from "./bgForHome";

export default function LandingPage() {
  return (
    <main className="w-full text-foreground bg-foreground">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col bg-background">
        <HeroBackground />
        
        <div className="relative z-10 flex flex-col grow">
          <div className="flex flex-col items-center justify-center grow text-center px-3 mx-auto gap-2">
            <Badge icon={<IconSparklesFilled className="h-4 font-bold text-primary"/>} className="text-xs mb-3">Kecerdasan Bisnis Berbasis-AI</Badge>
            <h1 className="text-5xl md:text-8xl font-semibold">
              Kelola Bisnis Makin <span className="inline-block bg-linear-to-b from-[#90FDF2] to-primary bg-clip-text text-transparent">eZ</span>
            </h1>
            <p className="text-sm md:text-xl font-light max-w-3xl">
              Ambil keputusan bisnis berdasarkan analisa berbasis data, serta insight bisnis berbasis kecerdasan buatan — sehingga anda selalu selangkah lebih maju
            </p>

            <div className="mt-6">
                <ButtonUpgradeDemo/>
            </div>
            {/* TODO: Hover preview video */}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="About" className="relative min-h-screen md:min-h-270 flex flex-col">
        <AboutBackground />
        
        {/* Make sure your content inside this section has a relative z-index so it sits above the background! */}
        <div className="relative z-10 w-full h-full">
          
        </div>
      </section>

      
      <section className="relative min-h-screen text-white">
        
      </section>

    </main>
  );
}