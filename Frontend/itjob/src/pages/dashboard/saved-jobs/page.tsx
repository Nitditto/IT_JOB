import { Link } from "react-router";
import { BookmarkX, Heart, Search } from "lucide-react";
import { CompactJobCard } from "@/components/jobs/CompactJobCard";
import { EmptyState, ErrorState, ListSkeleton, InlineNotice } from "@/components/feedback/InlineNotice";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useToastMessage } from "@/hooks/useToastMessage";
import { getApiErrorMessage } from "@/services/jobEngagementService";

export default function SavedJobsPage() {
  const { savedJobs, loading, error, mutatingId, reload, unsaveJob } = useSavedJobs();
  const { toast, showToast } = useToastMessage();

  const handleRemove = async (jobId: number) => {
    try {
      await unsaveJob(jobId);
      showToast("success", "Đã bỏ lưu công việc.");
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "Không thể bỏ lưu công việc."));
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <InlineNotice toast={toast} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Việc làm đã lưu</h1>
            <p className="text-sm text-slate-500">{savedJobs.length} công việc trong danh sách của bạn</p>
          </div>
        </div>
        <Link to="/search" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
          <Search size={16} /> Tìm thêm việc
        </Link>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : savedJobs.length === 0 ? (
        <EmptyState
          icon={<BookmarkX size={26} />}
          title="Chưa có việc làm nào được lưu"
          description="Khi thấy một tin phù hợp, lưu lại để so sánh lương, deadline và công ty trước khi ứng tuyển."
          action={
            <Link to="/search" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
              <Search size={16} /> Khám phá việc làm
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {savedJobs.map((item) => (
            <CompactJobCard
              key={item.id}
              job={item.job}
              savedAt={item.createdAt}
              removing={mutatingId === item.job.id}
              onRemove={() => handleRemove(item.job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
