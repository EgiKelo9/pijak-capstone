'use client';

import { FileSpreadsheet, PlayCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { SidebarTrigger } from '@/components/animate-ui/components/radix/sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { DATA } from './sidebar-data';

export function AppSidebarTopbar() {
  const pathname = usePathname();
  const showActionButtons = pathname === '/dashboard';

  // More robust breadcrumb: check exact match first, then prefix
  const currentPage = DATA.navMain.find(nav =>
    pathname === nav.url || pathname.startsWith(nav.url + '/')
  );
  const currentPageName = currentPage?.title ?? 'Dasbor';

  return (
    <header className="flex h-14 md:h-16 shrink-0 items-center justify-between border-b border-black/10 px-4 md:px-5">
      {/* Left: trigger + breadcrumb */}
      <div className="flex items-center gap-2 md:gap-3">
        <SidebarTrigger className="-ml-1 hover:bg-black/5 rounded-md p-1.5 transition-colors" />
        <Separator orientation="vertical" className="h-5 bg-black/15" />
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="font-medium text-[#A3A4A6] hover:text-black transition-colors">{DATA.user.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-black">{currentPageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right: action buttons */}
      {showActionButtons && (
        <div className="flex items-center gap-2 md:gap-3">
          <button className="flex h-9 md:h-10 items-center justify-center gap-2 rounded-lg border border-black/15 bg-gradient-to-b from-[#2BBAEE]/20 to-transparent px-3 md:px-4 transition-all hover:bg-[#2BBAEE]/10 active:scale-95 duration-150">
            <FileSpreadsheet className="size-4 text-black shrink-0" /><span className="font-sans text-sm font-medium text-black hidden sm:inline-block whitespace-nowrap">Ganti CSV</span>
          </button>
          <button className="flex h-9 md:h-10 items-center justify-center gap-2 rounded-lg border border-black/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] px-3 md:px-4 transition-all hover:opacity-90 active:scale-95 shadow-sm duration-150">
            <PlayCircle className="size-4 text-[#272727] shrink-0" /><span className="font-sans text-sm font-medium text-[#272727] hidden sm:inline-block whitespace-nowrap">Mulai Analisis</span>
          </button>
        </div>
      )}
    </header>
  );
}