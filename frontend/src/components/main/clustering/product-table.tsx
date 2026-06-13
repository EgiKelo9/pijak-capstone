import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLUSTER_COLORS, formatNumber } from '@/lib/utils';

export function ProductTable({ data, colFitur }: { data: Record<string, any>[]; colFitur: string[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: Record<string, any> } | null>(null);
  const perPage = 10;

  const filtered = useMemo(() =>
    data.filter(row => String(row.product).toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = useMemo(() => 
    filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );
  const displayCols = useMemo(() => colFitur.slice(0, 3), [colFitur]);
  
  const getRowValue = (row: Record<string, any>, key: string) => {
    if (key in row) return row[key];
    const lowerKey = key.toLowerCase();
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === lowerKey) return row[k];
    }
    return undefined;
  };

  const hasMetadata = useMemo(() => {
    if (!data || data.length === 0) return { category: false, segment: false, city: false, state: false };
    const sample = data[0];
    const keys = Object.keys(sample).map(k => k.toLowerCase());
    return {
      category: keys.includes('category'),
      segment: keys.includes('segment'),
      city: keys.includes('city'),
      state: keys.includes('state')
    };
  }, [data]);

  useEffect(() => {
    setHoveredRow(null);
    setTooltip(null);
  }, [data, search, page]);

  return (
    <div className="flex flex-col gap-3">
      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl border border-neutral-200 bg-white shadow-xl p-3 text-xs"
          style={{ left: tooltip.x + 14, top: tooltip.y - 70, minWidth: 200 }}>
          <p className="font-bold text-neutral-800 mb-2 truncate max-w-44">{tooltip.data.product}</p>
          
          {/* Metadata Section */}
          {['category', 'segment', 'city', 'state'].map(metaKey => {
            const val = getRowValue(tooltip.data, metaKey);
            if (val !== undefined && val !== null) {
              const labelMap: Record<string, string> = {
                category: 'Kategori',
                segment: 'Segmen',
                city: 'Kota',
                state: 'Provinsi'
              };
              return (
                <div key={metaKey} className="flex justify-between gap-4 py-0.5 border-b border-neutral-50 text-[11px]">
                  <span className="text-neutral-400">{labelMap[metaKey]}</span>
                  <span className="font-semibold text-neutral-600 truncate max-w-32">{val}</span>
                </div>
              );
            }
            return null;
          })}

          <div className="mt-2 pt-1">
            {colFitur.map(f => (
              <div key={f} className="flex justify-between gap-4 py-0.5">
                <span className="text-neutral-400">{f}</span>
                <span className="font-semibold text-neutral-700 tabular-nums">
                  {typeof tooltip.data[f] === 'number' ? formatNumber(tooltip.data[f]) : tooltip.data[f] ?? '-'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-neutral-100">
            <div className="size-2 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[tooltip.data.cluster % CLUSTER_COLORS.length] }} />
            <span className="font-bold text-neutral-700">Klaster {tooltip.data.cluster + 1}</span>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama produk..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-[#2BBAEE]/50 transition-all" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-100">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50/80 border-b border-neutral-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-neutral-500">Produk</th>
              {hasMetadata.category && <th className="text-left px-4 py-3 font-semibold text-neutral-500">Kategori</th>}
              {hasMetadata.segment && <th className="text-left px-4 py-3 font-semibold text-neutral-500">Segmen</th>}
              {hasMetadata.city && <th className="text-left px-4 py-3 font-semibold text-neutral-500">Kota</th>}
              {hasMetadata.state && <th className="text-left px-4 py-3 font-semibold text-neutral-500">Provinsi</th>}
              {displayCols.map(f => <th key={f} className="text-right px-4 py-3 font-semibold text-neutral-500 whitespace-nowrap">{f}</th>)}
              <th className="text-center px-4 py-3 font-semibold text-neutral-500">Klaster</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <tr><td colSpan={displayCols.length + 2 + (hasMetadata.category ? 1 : 0) + (hasMetadata.segment ? 1 : 0) + (hasMetadata.city ? 1 : 0) + (hasMetadata.state ? 1 : 0)} className="text-center py-10 text-neutral-400">Tidak ada produk ditemukan</td></tr>
              : paginated.map((row, i) => (
                <tr key={i}
                  onMouseEnter={() => { setHoveredRow(i); }}
                  onMouseMove={e => setTooltip({ x: e.clientX, y: e.clientY, data: row })}
                  onMouseLeave={() => { setHoveredRow(null); setTooltip(null); }}
                  className="border-b border-neutral-50 transition-all duration-150"
                  style={{
                    backgroundColor: hoveredRow === i ? 'rgba(43,186,238,0.05)' : 'transparent',
                    transform: hoveredRow === i ? 'translateX(2px)' : 'translateX(0)',
                  }}>
                  <td className="px-4 py-2.5 font-medium text-neutral-700 max-w-52 truncate">{row.product}</td>
                  {hasMetadata.category && <td className="px-4 py-2.5 text-neutral-600 max-w-36 truncate">{getRowValue(row, 'category') ?? '-'}</td>}
                  {hasMetadata.segment && <td className="px-4 py-2.5 text-neutral-600 max-w-36 truncate">{getRowValue(row, 'segment') ?? '-'}</td>}
                  {hasMetadata.city && <td className="px-4 py-2.5 text-neutral-600 max-w-36 truncate">{getRowValue(row, 'city') ?? '-'}</td>}
                  {hasMetadata.state && <td className="px-4 py-2.5 text-neutral-600 max-w-36 truncate">{getRowValue(row, 'state') ?? '-'}</td>}
                  {displayCols.map(f => (
                    <td key={f} className="px-4 py-2.5 text-right text-neutral-600 tabular-nums">
                      {typeof row[f] === 'number' ? formatNumber(row[f]) : row[f] ?? '-'}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center rounded-full w-6 h-6 text-[10px] font-bold transition-all duration-150"
                      style={{
                        backgroundColor: CLUSTER_COLORS[row.cluster % CLUSTER_COLORS.length] + (hoveredRow === i ? '40' : '25'),
                        color: CLUSTER_COLORS[row.cluster % CLUSTER_COLORS.length],
                        transform: hoveredRow === i ? 'scale(1.15)' : 'scale(1)',
                      }}>
                      {row.cluster + 1}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">{filtered.length} produk · hal. {page}/{totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 transition-colors">
              <ChevronLeft className="size-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                    p === page ? 'text-white shadow-sm' : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-50')}
                  style={p === page ? { backgroundColor: '#2BBAEE' } : {}}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 transition-colors">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
