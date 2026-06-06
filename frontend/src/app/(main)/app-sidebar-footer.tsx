'use client';

import { Bell, ChevronsUpDown, LogOut, Settings2 } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import {
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/animate-ui/components/radix/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { DATA } from './sidebar-data';

export function AppSidebarFooter() {
  const isMobile = useIsMobile();

  return (
    <SidebarFooter className="pb-6 px-5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="!size-auto !p-0 !bg-transparent hover:!bg-transparent active:!bg-transparent group/btn !overflow-visible">
                {/* Avatar ring — tighter than before */}
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#2BBAEE] p-1.5 transition-all duration-200 group-hover/btn:scale-105 group-hover/btn:shadow-md">
                  <Avatar className="size-11 rounded-full">
                    <AvatarImage src={DATA.user.avatar} alt={DATA.user.name} className="object-cover" />
                    <AvatarFallback className="text-white text-base font-bold bg-[#1a9fd4]">JD</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left leading-tight ml-3 group-data-[collapsible=icon]:hidden min-w-0">
                  <span className="font-sans truncate font-medium text-lg text-black">{DATA.user.name}</span>
                  <span className="font-sans truncate text-xs text-black/50 mt-0.5">{DATA.user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-black/40 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl" side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={DATA.user.avatar} alt={DATA.user.name} />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-semibold">{DATA.user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{DATA.user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem><Settings2 className="mr-2 size-4" />Pengaturan</DropdownMenuItem>
                <DropdownMenuItem><Bell className="mr-2 size-4" />Notifikasi</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 size-4" />Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}