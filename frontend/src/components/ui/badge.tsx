import * as React from "react"
import { cn } from "@/lib/utils" // Assumes you have the standard Tailwind merge utility

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
}

export function Badge({ 
  className, 
  icon, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-2 py-1 text-xs font-light text-foreground transition-colors",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="flex shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </div>
  )
}