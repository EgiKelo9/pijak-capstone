import { cn } from '@/lib/utils';
import { ClusteringResultData } from '@/types';

export function MetrikTable({ result }: { result: ClusteringResultData }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-100">
      <table className="w-full text-xs">
        <thead className="bg-neutral-50 border-b border-neutral-100">
          <tr>
            <th className="text-center px-4 py-2.5 font-semibold text-neutral-500">K</th>
            <th className="text-right px-4 py-2.5 font-semibold text-neutral-500">WCSS Score</th>
            <th className="text-right px-4 py-2.5 font-semibold text-neutral-500">Silhouette Score</th>
            <th className="text-center px-4 py-2.5 font-semibold text-neutral-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {result.k_range.map((k, i) => {
            const isOptimal = k === result.optimal_k;
            const isUsed = k === result.cluster_amount;
            return (
              <tr key={k} className={cn('border-b border-neutral-50 transition-colors',
                isOptimal ? 'bg-amber-50' : isUsed ? 'bg-[#2BBAEE]/5' : 'hover:bg-neutral-50/60')}>
                <td className="px-4 py-2 text-center font-bold text-neutral-800">{k}</td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-600">{result.wcss_list[i]?.toFixed(1)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-600">{result.silhouette_list[i]?.toFixed(4)}</td>
                <td className="px-4 py-2 text-center">
                  {isOptimal && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Optimal</span>}
                  {isUsed && !isOptimal && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2BBAEE]/15 text-[#2BBAEE]">Dipakai</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
