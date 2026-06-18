'use client';

import { SidebarHeader } from '@/components/animate-ui/components/radix/sidebar';

export function AppSidebarHeader() {
  return (
    <SidebarHeader className="pt-6 pb-3 px-5 transition-all duration-300 ease-in-out group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
      <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 transition-all duration-300 ease-in-out">
        {/* Icon container — fixed size in both states, no clipping */}
        <div className="flex size-14 shrink-0 items-center justify-center transition-transform duration-300 hover:scale-105">
          <img src="/LogoIcon.svg" alt="Logo BeeZ" className="size-10 object-contain" />
        </div>
        <span className="font-sans text-[2rem] font-semibold tracking-tight text-[#272727] overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out max-w-[100px] opacity-100 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-4">
          BeeZ
        </span>
      </div>
    </SidebarHeader>
  );
}