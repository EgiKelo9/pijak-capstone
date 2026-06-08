import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Note: React components should start with a capital letter (CtaButton instead of ctaButton)
const CtaButton = () => {
  return (
    <Link href='/analisis'>
      <Button 
        className="relative flex shrink-0 items-center justify-center text-sm font-semibold rounded-full h-12 py-1 pl-5 pr-16 group transition-all duration-500 hover:pl-16 hover:pr-5 w-fit overflow-hidden cursor-pointer ml-4"
        >
        <span className="relative z-10 transition-all duration-500 text-foreground">
          Dapatkan Insight
        </span>
        <div className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
          <ArrowUpRight size={16} />
        </div>
      </Button>
    </Link>
  );
};

export default CtaButton;