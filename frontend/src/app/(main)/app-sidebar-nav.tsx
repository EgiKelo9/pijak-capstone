'use client';

import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/animate-ui/components/radix/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/animate-ui/primitives/radix/collapsible';
import { DATA } from './sidebar-data';

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarContent className="px-5 mt-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
      <SidebarGroup className="p-0">
        <SidebarMenu className="gap-5">
          {DATA.navMain.map((item) =>
            item.items ? (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} className="!size-auto !p-0 !bg-transparent hover:!bg-transparent active:!bg-transparent group/btn !overflow-visible">
                      {/* Icon wrapper — consistent size, no overflow clipping */}
                      <div className="flex size-14 shrink-0 items-center justify-center transition-all duration-200 group-hover/btn:scale-110 group-hover/btn:-translate-y-0.5">
                        {item.icon && <img src={item.icon} alt={item.title} className="size-10 object-contain drop-shadow-sm" />}
                      </div>
                      <span className="font-sans font-medium text-black text-xl ml-3 group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      <ChevronRight className="ml-auto size-5 text-black/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-7 border-l border-black/30 px-0 gap-1 mt-2 group-data-[collapsible=icon]:hidden">
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="!h-auto !text-base py-1.5 pl-5 hover:!bg-transparent hover:translate-x-0.5 transition-all duration-150">
                            <a href={subItem.url}>
                              <span className={`font-normal transition-colors duration-150 ${pathname === subItem.url ? 'text-black font-medium' : 'text-black/60 hover:text-black'}`}>
                                {subItem.title}
                              </span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} className="!size-auto !p-0 !bg-transparent hover:!bg-transparent active:!bg-transparent group/btn !overflow-visible">
                  <a href={item.url} className="flex items-center w-full">
                    <div className="flex size-14 shrink-0 items-center justify-center transition-all duration-200 group-hover/btn:scale-110 group-hover/btn:-translate-y-0.5">
                      {item.icon && (
                        <img src={item.icon} alt={item.title} className="size-10 object-contain drop-shadow-sm" />
                      )}
                    </div>
                    <span className="font-sans font-medium text-black text-xl ml-3 group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}