import { CometCard } from "@/components/ui/comet-card";

interface ProfileCardProps {
  name: string;
  badge: string;
  image: string;
}

export function ProfileCard({ name, badge, image }: ProfileCardProps) {
  return (
    <CometCard>
      <div
        // FIXED: Added min-h-[22rem] and min-w-[14rem] to prevent flex-shrinking from crushing the card.
        // It will now maintain a healthy minimum size while still scaling up to max-w-[16.5rem].
        className="relative flex w-full min-w-56 max-w-66 min-h-96 sm:min-h-108 aspect-265/433 cursor-pointer flex-col items-center overflow-hidden rounded-4xl border-[0.4px] border-[#5D5D5D] shadow-2xl"
        style={{
          background: "linear-gradient(90deg, #333333 0%, #272727 100%)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Top Image Section */}
        <div
          className="relative flex w-full flex-1 flex-col items-center rounded-b-[2rem] overflow-hidden"
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
            className="absolute top-4 z-20 flex px-3 py-1 items-center justify-center rounded-full shadow-sm"
            style={{
              background: "linear-gradient(180deg, #90FDF2 0%, #2BBAEE 100%)",
              transform: "translateZ(30px)", 
            }}
          >
            <span className="font-sans text-[0.65rem] sm:text-xs font-[510] text-black leading-none whitespace-nowrap">
              {badge}
            </span>
          </div>

          {/* Profile Image (Transparent PNG) */}
          <img
            loading="lazy"
            alt={`Formal Photo of ${name}`}
            src={image}
            className="absolute bottom-0 z-10 h-full w-full object-cover object-bottom"
            style={{
              transform: "translateZ(10px)",
            }}
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
            className="font-sans text-2xl sm:text-3xl font-bold leading-none text-white tracking-tight text-center"
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