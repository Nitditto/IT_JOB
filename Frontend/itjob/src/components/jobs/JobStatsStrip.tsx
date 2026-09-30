import { Bookmark, Eye, FileText, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { useJobStats } from "@/hooks/useJobStats";

export function JobStatsStrip({ jobId }: { jobId: number }) {
  const { stats, loading, error, reload } = useJobStats(jobId);

  if (loading) {
    return (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <button onClick={reload} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        <RotateCw size={12} /> Tải lại thống kê
      </button>
    );
  }

  if (!stats) return null;

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      <Stat icon={<Eye size={14} />} label="7 ngày" value={stats.viewsLast7Days} />
      <Stat icon={<Bookmark size={14} />} label="Đã lưu" value={stats.savedCount} />
      <Stat icon={<FileText size={14} />} label="Ứng tuyển" value={stats.appliedCount} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1 text-xs font-medium text-slate-500">{icon}{label}</div>
      <div className="mt-1 text-base font-bold text-slate-900">{value.toLocaleString()}</div>
    </div>
  );
}
