import { ArrowRightIcon } from "@radix-ui/react-icons"
import { type ComponentPropsWithoutRef, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href: string
  cta: string
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        // Updated gap to 32px (gap-8) and row height to 338px to match Figma
        "grid w-full auto-rows-[338px] grid-cols-3 gap-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      // Added text-left to explicitly override any inherited text-center
      "group relative col-span-3 flex flex-col justify-end text-left overflow-hidden rounded-[32px]",
      "bg-neutral-900 border-[0.4px] border-[#5D5D5D]",
      className
    )}
    {...props}
  >
    {/* Background wrapper fixed behind content */}
    <div className="absolute inset-0 z-0">{background}</div>
    
    {/* Content Wrapper */}
    <div className="relative z-10 p-6 flex flex-col w-full">
      {/* Added items-start to force left alignment of flex children */}
      <div className="pointer-events-none flex transform-gpu flex-col items-start gap-4 transition-all duration-300 lg:group-hover:-translate-y-10">
        
        {/* Icon/Logo */}
        <Icon className="h-10 w-10 origin-left transform-gpu text-[#F3F3F3] transition-all duration-300 ease-in-out group-hover:scale-75" />
        
        <div className="flex flex-col gap-2 items-start w-full">
          {/* Title: Solid primary-foreground (off-white) and larger size */}
          <h3 className="text-2xl font-bold text-[#F3F3F3] sm:text-3xl">
            {name}
          </h3>
          
          {/* Caption Wrapper: animates max-height for smooth text expansion without layout jumping */}
          <div className="w-full overflow-hidden transition-all duration-300 ease-in-out max-h-[2.5rem] group-hover:max-h-[10rem]">
            <p className="w-full text-sm text-[#F3F3F3]/40 line-clamp-2 group-hover:line-clamp-none m-0">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div
        className={cn(
          "pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden mt-4"
        )}
      >
        <Button
          variant="link"
          asChild
          size="sm"
          className="pointer-events-auto p-0 text-[#F3F3F3]"
        >
          <a href={href}>
            {cta}
            <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
          </a>
        </Button>
      </div>
    </div>

    {/* Desktop Hover CTA */}
    <div
      className={cn(
        "pointer-events-none absolute bottom-0 z-10 hidden w-full translate-y-10 transform-gpu flex-row items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex"
      )}
    >
      <Button
        variant="link"
        asChild
        size="sm"
        className="pointer-events-auto p-0 text-[#F3F3F3]"
      >
        <a href={href}>
          {cta}
          <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
        </a>
      </Button>
    </div>

    {/* Subtle hover overlay */}
    <div className="pointer-events-none absolute inset-0 z-0 transform-gpu transition-all duration-300 group-hover:bg-black/10" />
  </div>
)

export { BentoCard, BentoGrid }
