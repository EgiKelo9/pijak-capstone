import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

export function GradientLineChart({ data, dataKey, color, endColor, gradientId, label, optimalK, yLabel }: {
  data: any[]; dataKey: string; color: string; endColor: string; gradientId: string;
  label: string; optimalK?: number; yLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id={`${gradientId}Line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
          <linearGradient id={`${gradientId}Area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="90%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="k" tick={{ fontSize: 11 }}
          label={{ value: 'Jumlah Klaster (K)', position: 'insideBottom', offset: -12, fontSize: 11 }} />
        <YAxis tick={{ fontSize: 10 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 } : undefined} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          formatter={(v: any) => [typeof v === 'number' ? v.toFixed(4) : v, label]} />
        {optimalK && (
          <ReferenceLine x={optimalK} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2}
            label={{ value: `K=${optimalK}`, position: 'top', fontSize: 10, fill: '#f59e0b' }} />
        )}
        <Area type="monotone" dataKey={dataKey}
          stroke={`url(#${gradientId}Line)`} strokeWidth={2.5}
          fill={`url(#${gradientId}Area)`}
          dot={({ cx, cy, payload }: any) => (
            <circle key={payload.k} cx={cx} cy={cy}
              r={payload.k === optimalK ? 7 : 4}
              fill={payload.k === optimalK ? '#f59e0b' : color}
              stroke="white" strokeWidth={2} />
          )} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
