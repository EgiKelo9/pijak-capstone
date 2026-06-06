import { cn } from "@/lib/utils";
import React from "react";
import { BorderBeam } from "./magicui/border-beam";

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  isRecommended: boolean;
  icon: React.ElementType;
  features: string[];
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Pemula",
    description: "Cocok untuk yang baru mulai merapikan catatan",
    price: "Rp 0",
    priceSuffix: "Gratis selamanya",
    isRecommended: false,
    icon: ({ className }: { className?: string }) => (
      <img 
        src="/icons8/icons8-soil-100.png" 
        alt="Box" 
        className={`${className} object-contain`} 
      />
    ),
    features: [
      "Visualisasi data dasar",
      "Maksimal 3 CSV / bulan",
      "Asisten AI (Standar)",
    ],
  },
  {
    name: "Juragan",
    description: "Solusi utuh untuk bisnis dengan volume transaksi tinggi",
    price: "Rp 16.7 K",
    priceSuffix: "Setiap bulan",
    isRecommended: true,
    icon: ({ className }: { className?: string }) => (
      <img 
        src="/icons8/icons8-alps-100.png" 
        alt="Sparkles" 
        className={`${className} object-contain`} 
      />
    ),
    features: [
      "Semua fitur di paket Pemula",
      "Prediksi Penjualan 3 bulan ke depan",
      "Asisten AI (Premium)",
    ],
  },
];

const Pricing = () => {
  return (
    <div className="mx-auto max-w-5xl xl:max-w-6xl 2xl:max-w-7xl px-4 md:px-8 w-full pt-8 md:pt-12">
      <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 w-full">
        {pricingPlans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>
    </div>
  );
};

const PlanCard = ({ plan }: { plan: PricingPlan }) => {
  return (
    <div
      className={cn(
        // ALWAYS keep relative, p-3, and the base border so the beam sits in front of it.
        "relative flex w-full flex-col flex-1 rounded-[2rem] 2xl:rounded-[2.5rem] p-2 md:p-3 gap-2 md:gap-3 border-[0.4px] border-[#5D5D5D] bg-foreground",
        {
          "shadow-xl": plan.isRecommended, // Add a slight shadow to pop if recommended
        }
      )}
    >
      {/* If recommended, place the beam here. It will absolute position itself over the parent border */}
      {plan.isRecommended && (
        <BorderBeam 
          duration={8} 
          size={200} 
          className="from-[#90FDF2]/15 via-[#2BBAEE] to-[#90FDF2]/15" // Matching button colors
        />
      )}

      {/* Top Block: Header / Description */}
      {/* We keep relative here just to ensure children (like icons) stack correctly over gradients */}
      <div className="relative z-10 flex flex-col items-start p-6 md:p-8 2xl:p-10 rounded-[1.5rem] 2xl:rounded-3xl bg-gradient-to-r from-[#272727] to-[#333333] border-[0.4px] border-[#5D5D5D] grow">
        <plan.icon className="size-10 md:size-12 mb-3 md:mb-4" />
        <div className="flex flex-col items-start text-left w-full gap-1">
          <h3 className="font-bold text-2xl md:text-3xl 2xl:text-4xl leading-[1.1] text-[#F3F3F3]">
            {plan.name}
          </h3>
          <p className="text-base md:text-lg 2xl:text-xl font-light text-[#F3F3F3]/40 leading-snug mt-1 md:mt-2">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Bottom Block: Pricing & Features */}
      <div className="relative z-10 flex flex-col shrink-0 p-6 md:p-8 2xl:p-10 rounded-[1.5rem] 2xl:rounded-3xl bg-gradient-to-r from-[#272727] to-[#333333] border-[0.4px] border-[#5D5D5D]">
        {/* ... rest of your content (price, button, features) ... */}
        <div className="mb-2 flex flex-col items-start text-left w-full gap-0">
          <h4 className="font-bold text-4xl md:text-5xl 2xl:text-6xl text-[#F3F3F3] leading-[1.1]">
            {plan.price}
          </h4>
          <p className="text-base md:text-lg 2xl:text-xl font-light text-[#F3F3F3]/40 mt-1">
            {plan.priceSuffix}
          </p>
        </div>

        <button
          className={cn(
            "my-6 2xl:my-8 w-full py-3 md:py-3.5 2xl:py-4 text-lg md:text-xl 2xl:text-2xl font-medium transition-all rounded-xl 2xl:rounded-2xl flex items-center justify-center",
            plan.isRecommended
              ? "bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] text-[#272727] hover:opacity-90 shadow-lg"
              : "border-[3px] border-[#5D5D5D] text-[#F3F3F3]/60 hover:bg-[#5D5D5D] hover:text-[#F3F3F3]"
          )}
        >
          Mulai Sekarang
        </button>

        <ul className="mt-2 2xl:mt-4 space-y-3 md:space-y-4 2xl:space-y-5">
          {plan.features.map((feature) => (
            <li className="flex items-center gap-3 md:gap-4" key={feature}>
              <img 
                src="/icons8/icons8-approval-100.png" 
                alt="Check" 
                className="size-6 md:size-7 2xl:size-8 shrink-0 object-contain" 
              />
              <span className="text-base md:text-lg 2xl:text-xl font-light text-[#F3F3F3]">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Pricing;