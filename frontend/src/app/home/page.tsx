// app/page.tsx
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

const TEAM_MEMBERS = [
    {
      id: 1,
      name: "B. Putra",
      badge: "Data Dweller",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "S. Lee",
      badge: "Code Weaver",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 3,
      name: "A. Patel",
      badge: "UI Sculptor",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 4,
      name: "J. Doe",
      badge: "Pixel Pusher",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 5,
      name: "M. Garcia",
      badge: "Bug Hunter",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 6,
      name: "E. Smith",
      badge: "Logic Lord",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    },
  ];

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

      {/* Home Section */}
      <section id="About" className="relative min-h-screen md:min-h-270 flex flex-col">
        <HomeBackground />
        
        <div className="relative z-10 w-full h-full my-auto flex flex-col justify-center items-center text-center gap-16">
          {/* Text Container */}
          <TextHome />
          <span className="text-lg font-medium text-foreground/40 max-w-4xl">
            Mengapa harus membuang waktu memilah data mentah?
            BeeZ secara cerdas menyajikan laporan visual yang menjabarkan tren, pengeluaran, dan pendapatan dengan kejernihan maksimal.
            Keputusan bisnis yang akurat dan berbasis data is just one click away!
          </span>
        </div>
      </section>

      
      <section className="relative flex min-h-screen w-full flex-col items-center bg-[#121212] pt-12 text-white lg:pt-20">
        <Tabs defaultValue={'tim'} className="flex w-full flex-col items-center">
          
          <TabsList className="z-10">
            <TabsTrigger value={'visi'}>Visi Kami</TabsTrigger>
            <TabsTrigger value={'tim'}>Tim Kami</TabsTrigger>
          </TabsList>

          <TabsContents className="w-full">
            <TabsContent value="tim" className="w-full">
              
              <div className="w-full overflow-x-auto py-24 px-8 flex items-center justify-start xl:justify-center">
                <div className="flex flex-row items-center justify-between gap-12 md:gap-20 lg:gap-28 w-full max-w-[120rem] min-w-max mx-auto">
                  
                  {TEAM_MEMBERS.map((member, index) => (
                    <div
                      key={member.id}
                      className={`shrink-0 transition-transform duration-500 ${
                        index % 2 === 0 ? "-translate-y-8 lg:-translate-y-12" : "translate-y-8 lg:translate-y-12"
                      }`}
                    >
                      <ProfileCard
                        name={member.name}
                        badge={member.badge}
                        image={member.image}
                      />
                    </div>
                  ))}

                </div>
              </div>
              <div className="w-full flex flex-col items-center justify-center px-6 py-16 md:py-24">
                <span className="text-lg font-medium max-w-7xl text-muted/40 text-center leading-relaxed">
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

    </main>
  );
}