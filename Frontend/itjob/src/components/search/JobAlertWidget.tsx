import { useState } from "react";
import { Link } from "react-router";
import { BellRing } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage, jobEngagementService } from "@/services/jobEngagementService";
import type { JobAlertRequest, JobPosition, JobWorkstyle } from "@/types";

function buildAlertFromFilters(searchParams: URLSearchParams): JobAlertRequest {
  const positions = searchParams.getAll("position");
  const workstyles = searchParams.getAll("workstyle");
  const minSalary = Number(searchParams.get("minSalary"));
  const maxSalary = Number(searchParams.get("maxSalary"));
  const query = searchParams.get("query") ?? undefined;
  const tags = searchParams.getAll("tags");

  return {
    name: query || tags[0] || searchParams.get("category") || "Việc làm IT mới",
    query,
    location: searchParams.get("location") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    tags,
    // Job alert chỉ lưu 1 giá trị cho mỗi trường này, nên chỉ nhận khi người dùng chọn đúng 1 mục
    position: positions.length === 1 ? (positions[0] as JobPosition) : undefined,
    workstyle: workstyles.length === 1 ? (workstyles[0] as JobWorkstyle) : undefined,
    minSalary: minSalary > 0 ? minSalary : undefined,
    maxSalary: maxSalary > 0 ? maxSalary : undefined,
    active: true,
  };
}

export const JobAlertWidget = ({ searchParams }: { searchParams: URLSearchParams }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const isCandidate = user?.role === "ROLE_USER";

  const createAlert = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await jobEngagementService.createJobAlert(buildAlertFromFilters(searchParams));
      setMessage({ kind: "success", text: "Đã tạo thông báo. Xem tại mục Thông báo việc làm trong dashboard." });
    } catch (error) {
      setMessage({ kind: "error", text: getApiErrorMessage(error, "Không thể tạo thông báo việc làm.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-700">
        <BellRing size={20} />
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-white">Nhận thông báo việc làm mới</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Lưu bộ lọc hiện tại và được báo khi có tin tuyển dụng phù hợp.
      </p>

      {isCandidate ? (
        <button
          type="button"
          onClick={createAlert}
          disabled={saving}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {saving ? "Đang tạo..." : "Tạo thông báo từ bộ lọc"}
        </button>
      ) : (
        <Link
          to="/login"
          className="mt-4 block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Đăng nhập ứng viên để tạo
        </Link>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.kind === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};
