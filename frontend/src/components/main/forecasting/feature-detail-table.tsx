'use client';

import { AnalysisCard } from '@/components/main-card';
import { FeatureDetail } from '@/types';

interface FeatureDetailTableProps {
  features?: FeatureDetail[];
}

export function FeatureDetailTable({ features = [] }: FeatureDetailTableProps) {
  return (
    <AnalysisCard title="Detail Fitur" className="flex flex-col h-full overflow-hidden" innerClassName="p-0 overflow-auto">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left text-neutral-500">
          <thead className="text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-4 py-3 font-medium">Nama Fitur</th>
              <th className="px-4 py-3 font-medium">Modus</th>
              <th className="px-4 py-3 font-medium">Rata-rata</th>
              <th className="px-4 py-3 font-medium">Maksimum</th>
              <th className="px-4 py-3 font-medium">Minimum</th>
              <th className="px-4 py-3 font-medium text-right">Pengaruh</th>
            </tr>
          </thead>
          <tbody>
            {features.length > 0 ? (
              features.map((f, i) => (
                <tr key={i} className="bg-white border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="px-4 py-2.5 font-medium text-neutral-700 whitespace-nowrap">{f.name}</td>
                  <td className="px-4 py-2.5">{f.mode.toFixed(1)}</td>
                  <td className="px-4 py-2.5">{f.mean.toFixed(1)}</td>
                  <td className="px-4 py-2.5">{f.max.toFixed(1)}</td>
                  <td className="px-4 py-2.5">{f.min.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    <span className={f.influence >= 0 ? "text-sky-500" : "text-neutral-400"}>
                      {(f.influence * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
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
