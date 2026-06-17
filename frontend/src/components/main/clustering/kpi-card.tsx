import { useHoverStyle } from "@/app/(main)/clustering/page";

export function KpiCard({ title, value, sub, opacity }: { title: string; value: string | number; sub: string; opacity: number }) {
  const { hovered, setHovered, style } = useHoverStyle();
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#2BBAEE]/20 p-6 text-center overflow-hidden"
      style={{
        ...style,
        background: `linear-gradient(135deg, rgba(43,186,238,${opacity}) 0%, rgba(144,253,242,${opacity * 0.7}) 100%)`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg, #2BBAEE, #90FDF2)' }} />
      <div className="absolute -bottom-4 -right-4 size-20 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: '#2BBAEE', opacity: hovered ? 0.12 : 0.06, transition: 'opacity 0.3s' }} />
      <p className="text-[11px] font-bold text-[#1a7fa8] uppercase tracking-widest relative z-10">{title}</p>
      <p className="text-5xl font-black tabular-nums leading-none relative z-10"
        style={{ color: `rgba(14,116,144,${Math.min(opacity * 6, 1)})` }}>{value}</p>
      <p className="text-xs relative z-10" style={{ color: `rgba(14,116,144,${Math.min(opacity * 5, 0.75)})` }}>{sub}</p>
    </div>
  );
}
