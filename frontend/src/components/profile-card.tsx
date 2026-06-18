import Image from "next/image";
import { CometCard } from "@/components/ui/comet-card";

interface ProfileCardProps {
  name: string;
  badge: string;
  image: string;
}

export function ProfileCard({ name, badge, image }: ProfileCardProps) {
  return (
    <CometCard className="w-[13rem] md:w-full">
      <div
        // Fully modular on desktop! Card naturally fills the CSS Grid column it sits in
        className="relative flex w-full aspect-[265/433] cursor-pointer flex-col items-center overflow-hidden rounded-[1.5rem] 2xl:rounded-[2rem] border-[0.4px] border-[#5D5D5D] shadow-2xl shrink-0"
        style={{
          background: "linear-gradient(90deg, #333333 0%, #272727 100%)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Top Image Section */}
        <div
          className="relative flex w-full flex-1 flex-col items-center rounded-b-[1.5rem] 2xl:rounded-b-[2rem] overflow-hidden"
          style={{
            background: `
              radial-gradient(84.85% 100% at 50% 0%, #F3F3F3 0%, #F3F3F3 57.37%, rgba(243, 243, 243, 0) 100%), 
              linear-gradient(180deg, #90FDF2 0%, #2BBAEE 100%)
            `,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Badge */}
          <div
            className="absolute bottom-4 z-20 flex px-3 py-1 items-center justify-center rounded-full shadow-sm"
            style={{
              background: "linear-gradient(180deg, #90FDF2 0%, #2BBAEE 100%)",
              transform: "translateZ(30px)", 
            }}
          >
            <span className="font-sans text-[0.6rem] md:text-xs 2xl:text-sm font-[510] text-black leading-none whitespace-nowrap">
              {badge}
            </span>
          </div>

          {/* Profile Image (Transparent PNG) */}
          <Image
            fill
            loading="lazy"
            draggable={false}
            alt={`Formal Photo of ${name}`}
            src={image}
            className="absolute bottom-0 z-10 object-cover object-bottom"
            style={{
              transform: "translateZ(10px)",
            }}
            unoptimized
          />
        </div>

        {/* Bottom Name Section */}
        <div
          className="flex w-full shrink-0 basis-[16.4%] items-center justify-center p-2"
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          <h2
          className="font-sans text-xl md:text-xl 2xl:text-3xl font-bold leading-none text-white tracking-tight text-center"
            style={{
              transform: "translateZ(25px)", 
            }}
          >
            {name}
          </h2>
        </div>
      </div>
    </CometCard>
  );
}