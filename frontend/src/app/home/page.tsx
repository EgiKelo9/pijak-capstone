import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabsHome";
import { ProfileCard } from "@/components/profile-card";
import ButtonUpgradeDemo from "@/components/shadcn-space/button/button-02";
import { Badge } from "@/components/ui/badge";
import { IconSparklesFilled } from "@tabler/icons-react";
import { HeroBackground, HomeBackground } from "./bgForHome";
import TextHome from "./textHome";
import TeamSection from "./teamsContainer";
import { BentoFeature } from "./featureBento";

export default function LandingPage() {
  return (
    <main className="w-full text-foreground bg-foreground">
      <section className="relative w-full min-h-screen flex flex-col bg-background">
        <HeroBackground />
        
        <div className="relative z-10 flex flex-col grow">
          <div className="flex flex-col items-center justify-center grow text-center px-4 md:px-3 mx-auto gap-2">
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
          </div>
        </div>
      </section>

      <section id="Home" className="relative min-h-screen md:min-h-270 flex flex-col">
        <HomeBackground />
        
        <div className="relative z-10 w-full h-full my-auto flex flex-col justify-center items-center text-center gap-8 md:gap-12 px-4 md:px-0">
          <TextHome />
          <span className="text-sm md:text-xl font-light text-foreground/40 max-w-3xl mt-10">
            Mengapa harus membuang waktu memilah data mentah?
            BeeZ secara cerdas menyajikan laporan visual yang menjabarkan tren, pengeluaran, dan pendapatan dengan kejernihan maksimal.
            Keputusan bisnis yang akurat dan berbasis data is just one click away!
          </span>
        </div>
      </section>

      <section id="About" className="relative flex min-h-screen w-full flex-col items-center pt-12 text-white lg:pt-20">
        <Tabs defaultValue={'tim'} className="flex w-full flex-col items-center">
          
          <TabsList className="z-10">
            <TabsTrigger value={'visi'}>Visi Kami</TabsTrigger>
            <TabsTrigger value={'tim'}>Tim Kami</TabsTrigger>
          </TabsList>

          <TabsContents className="w-full">
            <TabsContent value="tim" className="w-full">
              
              <TeamSection />

              <div className="w-full flex flex-col items-center justify-center px-4 py-12 md:py-24">
                <span className="text-sm md:text-xl font-light max-w-4xl text-muted/40 text-center leading-relaxed">
                  Kami mungkin lebih sering menghabiskan waktu di depan layar laptop daripada terjun langsung ke lapangan. 
                  Kami juga sadar kalau kami masih muda. 
                  Tapi justru karena itu kami ingin menyumbangkan apa yang kami bisa. 
                  Anggap saja kami sebagai tim IT pribadi Anda yang siap merapikan hal-hal rumit agar langkah bisnis Anda ke depan jauh lebih ringan.
                </span>
              </div>

            </TabsContent>
            {/* TODO: Selesaikan dibawah ini vvv */}
            <TabsContent value="visi" className="w-full">  

              <div className="w-full flex flex-col items-center justify-center px-4 py-12 md:py-24">
                <span className="text-sm md:text-xl font-light max-w-4xl text-muted/40 text-center leading-relaxed">
                  Kami mungkin lebih sering menghabiskan waktu di depan layar laptop daripada terjun langsung ke lapangan. 
                  Kami juga sadar kalau kami masih muda. 
                  Tapi justru karena itu kami ingin menyumbangkan apa yang kami bisa. 
                  Anggap saja kami sebagai tim IT pribadi Anda yang siap merapikan hal-hal rumit agar langkah bisnis Anda ke depan jauh lebih ringan.
                </span>
              </div>

            </TabsContent>
          </TabsContents>
        </Tabs>
      </section>

      <section id="Home" className="relative min-h-screen md:min-h-270 flex flex-col">
        <div className="relative z-10 w-full h-full my-auto flex flex-col justify-around items-center text-center gap-4 md:gap-12 px-4 md:px-0">
          {/* Container Title */}
          <div>
            <h1 className="text-5xl md:text-8xl font-extralight text-primary-foreground">
              Bersama Kami,
            </h1>
            <h1 className=" text-5xl md:text-8xl bg-linear-to-b from-[#90FDF2] to-primary bg-clip-text text-transparent">
              Kamu Bisa...
            </h1>
          </div>

          {/*  */}
          <BentoFeature />
        </div>
      </section>

    </main>
  );
}