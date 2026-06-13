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
    <SidebarContent className="px-5 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
      <SidebarGroup className="p-0">
        <SidebarMenu className="gap-5">
          {DATA.navMain.map((item) =>
            item.items ? (
              <Collapsible key={item.title} asChild defaultOpen={pathname.startsWith(item.url) || item.isActive} className="group/collapsible">
                <SidebarMenuItem>
                  <div className="flex items-center w-full group/btn">
                    <SidebarMenuButton asChild tooltip={item.title} className="!size-auto !p-0 !bg-transparent hover:!bg-transparent active:!bg-transparent flex-1 !overflow-visible">
                      <a href={item.url} className="flex items-center w-full">
                        <div className="flex size-14 shrink-0 items-center justify-center transition-all duration-200 group-hover/btn:scale-110 group-hover/btn:-translate-y-0.5">
                          {item.icon && <img src={item.icon} alt={item.title} className={`size-10 object-contain drop-shadow-sm ${pathname.startsWith(item.url) ? '' : 'opacity-80'}`} />}
                        </div>
                        <span className={`font-sans font-medium text-xl ml-3 group-data-[collapsible=icon]:hidden transition-colors ${pathname.startsWith(item.url) ? 'text-[#2BBAEE]' : 'text-black group-hover/btn:text-[#2BBAEE]'}`}>
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <button className="p-2 ml-auto group-data-[collapsible=icon]:hidden outline-none cursor-pointer">
                        <ChevronRight className="size-5 text-black/50 transition-colors transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover/btn:text-[#2BBAEE]" />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-7 border-l border-black/30 px-0 gap-1 mt-2 group-data-[collapsible=icon]:hidden">
                      {item.items.map((subItem) => {
                        const isSubActive = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild className="group/sub-btn !h-auto !text-base py-1.5 pl-5 hover:!bg-transparent hover:translate-x-0.5 transition-all duration-150">
                              <a href={subItem.url}>
                                <span className={`transition-colors duration-150 ${isSubActive ? 'text-[#2BBAEE] font-semibold' : 'text-black/60 font-normal group-hover/sub-btn:text-[#2BBAEE]'}`}>
                                  {subItem.title}
                                </span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} className="!size-auto !p-0 !bg-transparent hover:!bg-transparent active:!bg-transparent group/btn !overflow-visible">
                  <a href={item.url} className="flex items-center w-full">
                    <div className="flex size-14 shrink-0 items-center justify-center transition-all duration-200 group-hover/btn:scale-110 group-hover/btn:-translate-y-0.5">
                      {item.icon && <img src={item.icon} alt={item.title} className={`size-10 object-contain drop-shadow-sm ${pathname === item.url ? '' : 'opacity-80'}`} />}
                    </div>
                    <span className={`font-sans font-medium text-xl ml-3 group-data-[collapsible=icon]:hidden transition-colors ${pathname === item.url ? 'text-[#2BBAEE]' : 'text-black group-hover/btn:text-[#2BBAEE]'}`}>
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