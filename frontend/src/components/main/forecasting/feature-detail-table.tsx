'use client';

import { AnalysisCard } from '@/components/main-card';
import { FeatureDetail } from '@/types';

interface FeatureDetailTableProps {
  features?: FeatureDetail[];
}

function sortedFeatures(features: FeatureDetail[]): FeatureDetail[] {
  return [...features].sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence));
}

export function FeatureDetailTable({ features = [] }: FeatureDetailTableProps) {
  const sorted = sortedFeatures(features);

  return (
    <AnalysisCard title="Detail Fitur" className="flex flex-col h-full overflow-hidden" innerClassName="p-0 overflow-auto">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left text-neutral-500">
          <thead className="text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-4 py-3 font-medium">Nama Fitur</th>
              <th className="px-4 py-3 font-medium">Modus</th>
              <th className="px-4 py-3 font-medium">Rata-rata</th>
              <th className="px-4 py-3 font-medium">Maks</th>
              <th className="px-4 py-3 font-medium">Min</th>
              <th className="px-4 py-3 font-medium text-right">Pengaruh</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length > 0 ? (
              sorted.map((f, i) => {
                const isPercentage = Math.abs(f.influence) > 1;
                const displayInfluence = isPercentage ? f.influence : f.influence * 100;
                return (
                  <tr key={i} className="bg-white border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-4 py-2.5 font-medium text-neutral-700 whitespace-nowrap max-w-[120px] truncate">
                      {f.name}
                    </td>
                    <td className="px-4 py-2.5">{f.mode.toFixed(1)}</td>
                    <td className="px-4 py-2.5">{f.mean.toFixed(1)}</td>
                    <td className="px-4 py-2.5">{f.max.toFixed(1)}</td>
                    <td className="px-4 py-2.5">{f.min.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      <span className={displayInfluence >= 0 ? 'text-sky-500' : 'text-rose-400'}>
                        {displayInfluence >= 0 ? '+' : ''}{displayInfluence.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  Belum ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AnalysisCard>
  );
}
