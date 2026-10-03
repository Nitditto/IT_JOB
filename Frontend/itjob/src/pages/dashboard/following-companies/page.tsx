import { Link } from "react-router";
import { Building2, ExternalLink, HeartOff, MapPin, Users } from "lucide-react";
import { EmptyState, ErrorState, InlineNotice, ListSkeleton } from "@/components/feedback/InlineNotice";
import { useCompanyFollows } from "@/hooks/useCompanyFollows";
import { useToastMessage } from "@/hooks/useToastMessage";
import { getApiErrorMessage } from "@/services/jobEngagementService";

export default function FollowingCompaniesPage() {
  const { follows, loading, error, mutatingId, reload, unfollowCompany } = useCompanyFollows();
  const { toast, showToast } = useToastMessage();

  const handleUnfollow = async (companyId: number) => {
    try {
      await unfollowCompany(companyId);
      showToast("success", "Đã bỏ theo dõi công ty.");
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "Không thể bỏ theo dõi công ty."));
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <InlineNotice toast={toast} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Công ty đang theo dõi</h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi công ty để quay lại nhanh hồ sơ và tin tuyển dụng mới.</p>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : follows.length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title="Bạn chưa theo dõi công ty nào"
          description="Mở trang công ty hoặc chi tiết việc làm để theo dõi những nhà tuyển dụng bạn quan tâm."
          action={<Link to="/search" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">Tìm công ty qua việc làm</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {follows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md">
              <div className="flex gap-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2">
                  <img src={item.company.avatar || "/assets/images/avatar_default.png"} alt="" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-slate-900">{item.company.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                    {item.company.industry && <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1"><Users size={12} />{item.company.industry}</span>}
                    {item.company.location?.name && <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1"><MapPin size={12} />{item.company.location.name}</span>}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{item.company.description || "Công ty chưa cập nhật mô tả."}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/company/${item.company.id}`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100">
                      Xem công ty <ExternalLink size={14} />
                    </Link>
                    <button
                      onClick={() => handleUnfollow(item.company.id)}
                      disabled={mutatingId === item.company.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <HeartOff size={14} /> Bỏ theo dõi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
