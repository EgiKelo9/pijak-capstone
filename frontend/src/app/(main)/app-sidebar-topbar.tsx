'use client';

import { ChevronDown, FileSpreadsheet, Loader2, PlayCircle, Upload } from 'lucide-react';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
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

  const [datasets, setDatasets] = React.useState<any[]>([]);
  const [loadingDatasets, setLoadingDatasets] = React.useState(false);

  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      // We use "me" here because your backend automatically determines the user via the Bearer token
      const response = await fetch("http://localhost:5000/api/v1/datasets/user/me", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const result = await response.json();
      if (response.ok && result.data) {
        setDatasets(Array.isArray(result.data) ? result.data : result.data.datasets || []);
      }
    } catch (error) {
      console.error("Failed to fetch datasets", error);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const handleDatasetSelect = (datasetId: number) => {
    sessionStorage.setItem('pijak_active_dataset_id', datasetId.toString());
    window.dispatchEvent(new Event('dataset_changed'));
  };

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
          <DropdownMenu onOpenChange={(open) => { if (open) fetchDatasets(); }}>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 md:h-10 items-center justify-center gap-2 rounded-lg border border-black/15 bg-gradient-to-b from-[#2BBAEE]/20 to-transparent px-3 md:px-4 transition-all hover:bg-[#2BBAEE]/10 active:scale-95 duration-150">
                <FileSpreadsheet className="size-4 text-black shrink-0" />
                <span className="font-sans text-sm font-medium text-black hidden sm:inline-block whitespace-nowrap">Ganti CSV</span>
                <ChevronDown className="size-4 text-black/50 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>Pilih Dataset</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-48 overflow-y-auto">
                {loadingDatasets ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="size-4 animate-spin text-black/50" />
                  </div>
                ) : datasets.length > 0 ? (
                  datasets.map((ds) => (
                    <DropdownMenuItem key={ds.id} onClick={() => handleDatasetSelect(ds.id)} className="cursor-pointer">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{ds.filename || `Dataset #${ds.id}`}</span>
                        {ds.created_at && <span className="truncate text-xs text-black/50">{new Date(ds.created_at).toLocaleDateString()}</span>}
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-3 text-center text-sm text-black/50">Belum ada dataset</div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.dispatchEvent(new Event('open_upload_modal'))} className="cursor-pointer text-[#2BBAEE] focus:text-[#2BBAEE] font-medium">
                <Upload className="mr-2 size-4" />Unggah Baru
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="flex h-9 md:h-10 items-center justify-center gap-2 rounded-lg border border-black/10 bg-gradient-to-b from-[#90FDF2] to-[#2BBAEE] px-3 md:px-4 transition-all hover:opacity-90 active:scale-95 shadow-sm duration-150">
            <PlayCircle className="size-4 text-[#272727] shrink-0" /><span className="font-sans text-sm font-medium text-[#272727] hidden sm:inline-block whitespace-nowrap">Mulai Analisis</span>
          </button>
        </div>
      )}
    </header>
  );
}