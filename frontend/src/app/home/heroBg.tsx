// components/HeroBackground.tsx
"use client";

import PixelBlast from "@/components/PixelBlast";

export default function HeroBackground() {
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