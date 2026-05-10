"use client";

import PixelBlast from "@/components/PixelBlast";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
      <PixelBlast
        variant="square"
        pixelSize={2.8}
        color="#2BBAEE"
        patternScale={1.6}
        patternDensity={1.2}
        enableRipples={true}
        rippleSpeed={0.48}
        rippleThickness={0.16}
        rippleIntensityScale={1.6}
        speed={1.2}
        transparent
        edgeFade={0.67}
      />
    </div>
  );
}

export function HomeBackground() {
  return (
    <>
      <style>{`
        .home-bg {
          /* 📱 MOBILE: Removed min-height so it defers to the parent section */
          background: linear-gradient(180deg, #ffffff 40%, #90FDF2 80%, #2BBAEE 100%);
          border-radius: 0px;
        }

        /* 💻 DESKTOP */
        @media (min-width: 768px) {
          .home-bg {
            /* Removed min-height here as well */
            border-bottom-left-radius: 120px;
            border-bottom-right-radius: 120px;
            background: 
              radial-gradient(84.85% 100% at 50% 0%, #ffffff 0%, #ffffff 57.37%, rgba(243, 243, 243, 0) 100%), 
              linear-gradient(180deg, #90FDF2 0%, #2BBAEE 100%);
            box-shadow: 0px 33px 250px rgba(255, 255, 255, 0.067);
          }
        }
      `}</style>

      {/* Changed absolute positioning to stretch fully: inset-0 h-full */}
      <div className="home-bg absolute inset-0 w-full h-full z-0 pointer-events-none" />
    </>
  );
}

export function CtaBackground() {
  return (
    <>
      <style>{`
        .cta-bg {
          /* 📱 MOBILE: Simple gradient, deferring radius to desktop */
          background: linear-gradient(180deg, #90FDF2 0%, #2BBAEE 100%);
          border-radius: 0px;
        }

        /* 💻 DESKTOP */
        @media (min-width: 768px) {
          .cta-bg {
            border-top-left-radius: 120px;
            border-top-right-radius: 120px;
            background: linear-gradient(180deg, #90FDF2 0%, #2BBAEE 100%);
            box-shadow: 
              0px -33px 250px rgba(255, 255, 255, 0.06), 
              inset -180px 0px 250px rgba(255, 255, 255, 0.63), 
              inset 180px 0px 250px rgba(255, 255, 255, 0.63);
          }
        }
      `}</style>

      <div className="cta-bg absolute inset-0 w-full h-full z-0 pointer-events-none" />
    </>
  );
}