"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  BarChart2,
  ChevronDown,
  GitFork,
  MoreHorizontal,
  RefreshCcw,
  SearchIcon,
  Waypoints,
  X
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnalysisStatus = "menunggu" | "berhasil" | "gagal" ;
export type AnalysisMethod = "Clustering" | "Forecasting" | "Classification" | string;

export interface AnalysisRow {
  id: string;
  dataset: string;
  tanggal: string;
  metode: AnalysisMethod;
  status: AnalysisStatus;
  insight: string;
  confidence_level?: number | null;
  silhouette_score?: number | null;
}

// ── Status config — dot only, NO background pill ──────────────────────────────
// Matches screenshot exactly: colored dot + colored label text, no bg tint
const statusConfig: Record<AnalysisStatus, { dot: string; text: string; label: string }> = {
  menunggu: { dot: "bg-amber-500",   text: "text-amber-500",   label: "Menunggu" },
  berhasil: { dot: "bg-emerald-500", text: "text-emerald-600", label: "Berhasil" },
  gagal:    { dot: "bg-rose-500",    text: "text-rose-500",    label: "Gagal"    },
};

// ── Method icon — dark/black as in screenshot ─────────────────────────────────
function MethodIcon({ method }: { method: string }) {
  const lower = method.toLowerCase();
  const cls = "size-3.5 shrink-0 text-neutral-800";
  if (lower.includes("cluster"))  return <Waypoints  className={cls} />;
  if (lower.includes("forecast")) return <BarChart2  className={cls} />;
  if (lower.includes("classif"))  return <GitFork    className={cls} />;
  return <BarChart2 className={cls} />;
}

// ── Sort header button ────────────────────────────────────────────────────────
function SortHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
    >
      {label}
      <ArrowUpDown className="size-3.5 opacity-50" />
    </button>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────
function buildColumns(
  onAction?: (action: string, row: AnalysisRow) => void,
  onViewDetail?: (row: AnalysisRow) => void
): ColumnDef<AnalysisRow>[] {
  return [
    {
      accessorKey: "dataset",
      header: ({ column }) => (
        <SortHeader
          label="Dataset"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        // Pill: very light cyan bg, #2BBAEE text, mono font, rounded-md
        <span className="inline-block rounded-md bg-linear-to-b from-[#2BBAEE]/12 to-transparent px-2 py-0.5 font-mono text-[11px] text-[#2BBAEE] truncate max-w-[120px] sm:max-w-[160px]">
          {row.getValue("dataset")}
        </span>
      ),
    },
    {
      accessorKey: "tanggal",
      header: ({ column }) => (
        <SortHeader
          label="Tanggal"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <span className="block text-xs text-neutral-700 truncate max-w-[90px] sm:max-w-[120px]">
          {row.getValue("tanggal")}
        </span>
      ),
    },
    {
      accessorKey: "metode",
      header: ({ column }) => (
        <SortHeader
          label="Metode Analisis"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const method = row.getValue("metode") as string;
        return (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <MethodIcon method={method} />
            <span className="text-xs text-neutral-800 truncate max-w-[100px]">{method}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortHeader
          label="Status"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const s = row.getValue("status") as AnalysisStatus;
        const cfg = statusConfig[s] ?? statusConfig.menunggu;
        return (
          // NO background — just dot + colored label, matching screenshot
          <div className="flex items-center gap-1.5 overflow-hidden border border-neutral-800/20 rounded-full justify-start px-4 w-fit">
            <span className={cn("size-2 rounded-full shrink-0", cfg.dot)} />
            <span className={cn("font-mono text-[11px] font-medium truncate", cfg.text)}>
              {cfg.label}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "insight",
      header: ({ column }) => (
        <SortHeader
          label="Insight BeezAI"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const s   = row.getValue("status") as AnalysisStatus;
        const txt = row.getValue("insight") as string;
        return (
          <p
            className={cn(
              "text-xs truncate max-w-[150px] sm:max-w-[220px] md:max-w-[300px] lg:max-w-[400px]",
              // gagal    → rose bold (error message style)
              s === "gagal"    && "text-rose-500 font-semibold",
              // menunggu / berjalan → amber (in-progress)
              (s === "menunggu" || s === "berjalan") && "text-amber-500",
              // berhasil → plain neutral
              s === "berhasil" && "text-neutral-600",
            )}
          >
            {txt}
          </p>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-700"
              variant="ghost"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs text-neutral-500">Aksi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              onViewDetail?.(row.original);
              onAction?.("view", row.original);
            }}>
              Lihat Detail
            </DropdownMenuItem>
            {/* <DropdownMenuItem onClick={() => onAction?.("rerun", row.original)}>
              Jalankan Ulang
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-500 focus:text-rose-500"
              onClick={() => onAction?.("delete", row.original)}
            >
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

// ── Main component ────────────────────────────────────────────────────────────

interface DynamicDataTableProps {
  data?: AnalysisRow[];
  onAction?: (action: string, row: AnalysisRow) => void;
  searchPlaceholder?: string;
}

export function DynamicDataTable({
  data,
  onAction,
  searchPlaceholder = "Cari riwayat...",
}: DynamicDataTableProps) {
  const [globalFilter, setGlobalFilter]           = React.useState("");
  const [columnSearchQuery, setColumnSearchQuery] = React.useState("");
  const [sorting, setSorting]                     = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters]         = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility]   = React.useState<VisibilityState>({});
  const [detailRow, setDetailRow]                 = React.useState<AnalysisRow | null>(null);

  const columns   = React.useMemo(() => buildColumns(onAction, setDetailRow), [onAction, setDetailRow]);
  const tableData = React.useMemo(() => data ?? [], [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
  });

  return (
    <div className="flex h-full w-full flex-col min-h-0 bg-white">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-4 mb-3">

        {/* Search — pill shaped, very subtle border, matching screenshot */}
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
          <Input
            className="pl-10 h-9 rounded-md border-neutral-200 bg-white text-sm
                       placeholder:text-neutral-400 focus-visible:ring-1
                       focus-visible:ring-[#2BBAEE]/40 focus-visible:border-[#2BBAEE]/60"
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            value={globalFilter}
          />
        </div>

        {/* Columns toggle — right-aligned, plain outline, matches screenshot */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="ml-auto h-9 rounded-md shadow-none border-neutral-200 bg-white
                         text-sm text-neutral-600 hover:bg-neutral-50 gap-1.5"
              variant="outline"
            >
              Columns
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="relative p-1">
              <Input
                className="pl-8 h-8 text-xs"
                onChange={(e) => setColumnSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search columns..."
                value={columnSearchQuery}
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            </div>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .filter((col) =>
                columnSearchQuery
                  ? col.id.toLowerCase().includes(columnSearchQuery.toLowerCase())
                  : true
              )
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  className="capitalize text-sm"
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                table.resetColumnVisibility();
                setColumnSearchQuery("");
              }}
            >
              <RefreshCcw className="size-3.5" />
              Reset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 w-full flex flex-col rounded-xl border border-neutral-800/20 overflow-hidden">
        <div className="flex-1 min-h-0 [&>div]:h-full [&>div]:overflow-auto">
          <Table>
            {/* Sticky header with a bottom divider, light bg */}
            <TableHeader className="sticky top-0 z-20 bg-neutral-50/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="border-y-0 border-b border-neutral-200/80 hover:bg-transparent"
              >
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-9 px-3 text-[11px] font-medium text-neutral-500 bg-transparent whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <BarChart2 className="size-8 text-neutral-300" />
                    <p className="text-sm font-medium text-neutral-500">
                      {tableData.length > 0
                        ? "Tidak ada hasil ditemukan"
                        : "Belum ada riwayat analisis"}
                    </p>
                    <p className="text-xs text-neutral-400 max-w-xs">
                      {tableData.length > 0
                        ? "Coba ubah kata kunci pencarian Anda."
                        : "Unggah dataset dan jalankan analisis pertama Anda."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between px-2 pt-3 pb-1">
        <span className="text-xs text-neutral-400">
          Total {table.getFilteredRowModel().rows.length} baris
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-500">
            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
          </span>
          <div className="flex gap-2">
            <Button
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-xs border-neutral-200 text-neutral-600"
            >
              Previous
            </Button>
            <Button
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-xs border-neutral-200 text-neutral-600"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ── Modal Detail Insight ────────────────────────────────────────────── */}
      {detailRow && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setDetailRow(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 border border-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/50">
              <div className="flex flex-col gap-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <MethodIcon method={detailRow.metode} />
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{detailRow.metode}</span>
                </div>
                <h3 className="font-bold text-xl text-neutral-900 leading-tight">Detail Insight</h3>
                <p className="text-sm text-neutral-500 font-medium mt-1">{detailRow.dataset} • {detailRow.tanggal}</p>
              </div>
              <button onClick={() => setDetailRow(null)} className="p-2 -mr-2 rounded-full hover:bg-neutral-200/60 text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
              <div className="rounded-xl bg-[#2BBAEE]/5 border border-[#2BBAEE]/20 p-5">
                <p className="text-sm md:text-base text-neutral-700 leading-relaxed font-medium">
                  {detailRow.insight || "Belum ada insight yang dihasilkan untuk analisis ini."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}