import { useState } from "react";
import { BellOff, Eye, Pencil, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, InlineNotice, ListSkeleton } from "@/components/feedback/InlineNotice";
import { CompactJobCard } from "@/components/jobs/CompactJobCard";
import { JobAlertForm } from "@/components/jobs/JobAlertForm";
import { useJobAlerts } from "@/hooks/useJobAlerts";
import { useToastMessage } from "@/hooks/useToastMessage";
import { getApiErrorMessage } from "@/services/jobEngagementService";
import type { JobAlertRequest, JobAlertResponse } from "@/types";

export default function JobAlertsPage() {
  const [editing, setEditing] = useState<JobAlertResponse | null>(null);
  const { alerts, loading, error, saving, matches, matchesLoadingId, reload, saveAlert, deleteAlert, previewMatches } = useJobAlerts();
  const { toast, showToast } = useToastMessage();

  const handleSubmit = async (payload: JobAlertRequest, alertId?: number) => {
    try {
      await saveAlert(payload, alertId);
      setEditing(null);
      showToast("success", alertId ? "Đã cập nhật thông báo." : "Đã tạo thông báo việc làm.");
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "Không thể lưu thông báo."));
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!window.confirm("Xóa thông báo việc làm này?")) return;
    try {
      await deleteAlert(alertId);
      showToast("success", "Đã xóa thông báo.");
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "Không thể xóa thông báo."));
    }
  };

  const handlePreview = async (alertId: number) => {
    try {
      await previewMatches(alertId);
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "Không thể xem việc phù hợp."));
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[420px_1fr] lg:p-8">
      <InlineNotice toast={toast} />
      <div>
        <JobAlertForm editing={editing} saving={saving} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
      </div>

      <div>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Thông báo việc làm</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý các bộ lọc bạn muốn theo dõi thường xuyên.</p>
        </div>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<BellOff size={26} />}
            title="Chưa có thông báo nào"
            description="Tạo một thông báo theo kỹ năng, lương hoặc hình thức làm việc để xem nhanh việc phù hợp."
          />
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{alert.name}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${alert.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {alert.active ? "Đang bật" : "Đã tắt"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                      {alert.query && <span className="rounded-lg bg-slate-100 px-2 py-1">{alert.query}</span>}
                      {alert.industry && <span className="rounded-lg bg-slate-100 px-2 py-1">{alert.industry}</span>}
                      {alert.workstyle && <span className="rounded-lg bg-slate-100 px-2 py-1">{alert.workstyle}</span>}
                      {alert.tags?.map((tag) => <span key={tag} className="rounded-lg bg-indigo-50 px-2 py-1 text-indigo-700">{tag}</span>)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handlePreview(alert.id)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100">
                      <Eye size={14} /> {matchesLoadingId === alert.id ? "Đang xem..." : "Xem việc"}
                    </button>
                    <button onClick={() => setEditing(alert)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Sửa">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(alert.id)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title="Xóa">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {matches[alert.id] && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {matches[alert.id].length === 0 ? (
                      <p className="text-sm text-slate-500">Chưa có việc nào khớp bộ lọc này.</p>
                    ) : (
                      matches[alert.id].slice(0, 3).map((job) => <CompactJobCard key={job.id} job={job} />)
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
