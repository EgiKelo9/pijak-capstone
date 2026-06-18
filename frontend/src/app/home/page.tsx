import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabsHome";
import Pricing from "@/components/pricing";
import ButtonUpgradeDemo from "@/components/shadcn-space/button/button-02";
import { Badge } from "@/components/ui/badge";
import { BlurredStagger } from "@/components/ui/blurred-stagger-text";
import { Button } from "@/components/ui/button";
import LoadingCarousel from "@/components/ui/loading-carousel";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { IconSparklesFilled } from "@tabler/icons-react";
import { CtaBackground, HeroBackground, HomeBackground } from "./bg-for-home";
import { BentoFeature } from "./feature-bento";
import TeamSection from "./teams-container";
import TextHome from "./text-home";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="w-full text-foreground bg-foreground">
      <section className="relative w-full min-h-screen flex flex-col bg-background">
        <HeroBackground />
        
        <div className="relative z-10 flex flex-col grow">
          <div className="flex flex-col items-center justify-center grow text-center px-4 md:px-3 mx-auto gap-2">
            <Badge icon={<IconSparklesFilled className="h-4 font-bold text-primary"/>} className="text-xs mb-3">Kecerdasan Bisnis Berbasis-AI</Badge>
            <h1 className="text-5xl md:text-7xl 2xl:text-8xl font-semibold">
              Kelola Bisnis Makin <span className="inline-block bg-linear-to-b from-[#90FDF2] to-primary bg-clip-text text-transparent">eZ</span>
            </h1>
            <p className="text-sm md:text-lg 2xl:text-xl font-light max-w-2xl md:max-w-3xl 2xl:max-w-4xl">
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
          <span className="text-sm md:text-lg 2xl:text-xl font-light text-foreground/40 max-w-2xl md:max-w-3xl 2xl:max-w-4xl mt-8 md:mt-10 2xl:mt-12">
            Mengapa harus membuang waktu memilah data mentah?
            BeeZ secara cerdas menyajikan laporan visual yang menjabarkan tren, pengeluaran, dan pendapatan dengan kejernihan maksimal.
            Keputusan bisnis yang akurat dan berbasis data is just one click away!
          </span>
        </div>
      </section>

      <section id="About" className="relative flex min-h-screen w-full flex-col items-center pt-12 text-white lg:pt-20">
        <Tabs defaultValue={'tim'} className="flex flex-1 w-full flex-col items-center">
          
          <TabsList className="z-10 shrink-0 border-[#5D5D5D]/20 border-1">
            <TabsTrigger value={'visi'}>Visi Kami</TabsTrigger>
            <TabsTrigger value={'tim'}>Tim Kami</TabsTrigger>
          </TabsList>

          <TabsContents className="w-full flex-1 flex flex-col justify-center">
            <TabsContent value="visi" className="w-full">  
              <div className="w-full max-w-[86vw] mx-auto grid grid-cols-1 lg:grid-cols-14 gap-12 lg:gap-16 px-6 lg:px-12 py-12 lg:py-24 items-center ">
              
                {/* Left Side: Text Content */}
                <div className="w-full lg:col-span-8 flex flex-col items-start gap-12 min-w-0 break-words">
                  
                  {/* Block 1 */}
                  <div className="flex flex-col items-start gap-2 2xl:gap-3 w-full">
                    <div className="w-full max-w-full">
                      <BlurredStagger 
                        mode="sentence" 
                        text="Melihat dari dekat" 
                      />
                    </div>
                    <div className="w-full max-w-full">
                      <BlurredStagger 
                        mode="paragraph" 
                        text="Kami mengamati ekonomi dewasa ini dan melihat banyak usaha lokal yang hebat tapi tertahan oleh hal teknis. Terlalu banyak waktu habis hanya untuk merapikan nota dan menebak-nebak stok barang. Padahal energi sebesar itu jauh lebih berharga jika dipakai untuk berinovasi." 
                      />
                    </div>
                  </div>

                  {/* Block 2 */}
                  <div className="flex flex-col items-start gap-2 2xl:gap-3 w-full">
                    <div className="w-full max-w-full">
                      <BlurredStagger 
                        mode="sentence" 
                        text="Teknologi tidak seharusnya eksklusif" 
                      />
                    </div>
                    <div className="w-full max-w-full">
                      <BlurredStagger 
                        mode="paragraph" 
                        text="Seringkali alat analitik bisnis yang bagus itu mahal dan rumit. Kami merasa sistem cerdas harus bisa diakses siapa saja tanpa perlu belajar IT bertahun-tahun. Canggih itu tidak harus membingungkan dan pintar itu harusnya mudah dipakai." 
                      />
                    </div>
                  </div>

                  {/* Block 3 */}
                  <div className="flex flex-col items-start gap-2 2xl:gap-3 w-full">
                    <div className="w-full max-w-full">
                      <BlurredStagger 
                        mode="sentence" 
                        text="Biar kami yang urus datanya" 
                      />
                    </div>
                    <div className="w-full max-w-full">
                      <BlurredStagger 
                        mode="paragraph" 
                        text="Pada akhirnya BeeZ dibuat dengan satu tujuan sederhana. Kami ingin merapikan angka dan grafik yang memusingkan itu untuk Anda. Biarkan sistem kami yang bekerja di belakang layar agar Anda bisa fokus membesarkan usaha dan punya lebih banyak waktu untuk beristirahat." 
                      />
                    </div>
                  </div>

                </div>

                {/* Right Side: Carousel */}
                {/* col-span-5 creates a nice asymmetric balance against the text */}
                <div className="w-full lg:col-span-6 min-w-0 border-[0.4px] border-[#5D5D5D] rounded-4xl overflow-hidden flex flex-col shadow-xl">
                  <LoadingCarousel 
                    autoplayInterval={4200}
                    // showNavigation={true} 
                    tips={[
                      { 
                        text: "Energi besar Anda terlalu berharga jika hanya dihabiskan untuk merapikan tumpukan kertas.", 
                        image: "/carousel/slide1-struggle.webp" 
                      },
                      { 
                        text: "Sistem analitik seringkali terasa mahal, rumit, dan butuh keahlian IT untuk memahaminya.", 
                        image: "/carousel/slide2-barrier.jpg" 
                      },
                      { 
                        text: "Padahal, teknologi yang benar-benar pintar seharusnya mudah dipakai oleh siapa saja.", 
                        image: "/carousel/slide3-accessible.webp" 
                      },
                      { 
                        text: "Di sinilah kami hadir. Biarkan sistem kami yang memproses kerumitan data di belakang layar.", 
                        image: "/carousel/slide4-insights.webp" 
                      },
                      { 
                        text: "Kini, Anda punya ruang untuk terus berinovasi dan waktu yang cukup untuk beristirahat.", 
                        image: "/carousel/slide5-outcome.webp" 
                      }
                    ]}
                  />
                </div>
            </div>

            </TabsContent>

            <TabsContent value="tim" className="w-full">
              
              <TeamSection />

              <div className="w-full flex flex-col items-center justify-center px-4 py-12 md:py-24">
                <span className="text-sm md:text-lg 2xl:text-xl font-light max-w-2xl md:max-w-3xl 2xl:max-w-4xl text-muted/40 text-center leading-relaxed">
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

      <section id="Feature" className="relative min-h-screen md:min-h-270 flex flex-col">
        <div className="relative z-10 w-full h-full my-auto flex flex-col justify-around items-center text-center gap-3 md:gap-6 px-4 md:px-0">
          {/* Container Title */}
          <div>
            <h1 className="text-5xl md:text-7xl 2xl:text-8xl font-extralight text-primary-foreground">
              Bersama Kami,
            </h1>
            <h1 className="text-5xl md:text-7xl 2xl:text-8xl bg-linear-to-b from-[#90FDF2] to-primary bg-clip-text text-transparent">
              Kamu Bisa...
            </h1>
          </div>

          <BentoFeature />
        </div>
      </section>
      
      <section id="Pricing" className="relative min-h-screen  flex flex-col">
        <div className="relative z-10 w-full h-full my-auto flex flex-col justify-around items-center text-center gap-3 md:gap-6 px-4 md:px-0 mb-20">
          {/* Container Title */}
          <div>
            <h1 className="text-5xl md:text-7xl 2xl:text-8xl font-extralight text-primary-foreground">
              Berkomitmen
            </h1>
            <h1 className="text-5xl md:text-7xl 2xl:text-8xl bg-linear-to-b from-[#90FDF2] to-primary bg-clip-text text-transparent">
              Bersama Kami
            </h1>
          </div>

          <Pricing />
        </div>
      </section>

      <section id="Home" className="relative min-h-screen md:min-h-270 flex flex-col overflow-y-clip">
        <CtaBackground />
        
        {/* Replaced 'h-full my-auto' with 'flex-1' and restored 'lg:py-24' so it doesn't hit the screen edge */}
        <div className="relative z-10 w-full flex-1 flex flex-col justify-between items-center text-center gap-4 md:gap-12 px-4 md:px-0 py-12 lg:py-24">
          <div className="flex flex-col items-center gap-8 md:gap-12">
            <h2 className="text-5xl md:text-7xl 2xl:text-9xl font-medium leading-tight">
                Berhenti menebak,
              <br/>
                mulai bertindak.
            </h2>
            
            <Link href="/dasbor">
              <Button className="px-6 py-4 md:px-8 md:py-7 2xl:px-12 2xl:py-10 text-xl md:text-2xl 2xl:text-3xl rounded-full bg-[#272727] hover:bg-[#333333] border-[0.4px] border-[#5D5D5D] shadow-xl hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer">
                <span className="bg-linear-to-b from-[#90FDF2] to-primary bg-clip-text text-transparent">
                  Mulai Lebih eZ
                </span>
              </Button>
            </Link>
          </div>
          <div className="w-full max-h-[24vh]">
            <TextHoverEffect text="BeeZ" />
          </div>
        </ div>
      </section>

    </main>
  );
}