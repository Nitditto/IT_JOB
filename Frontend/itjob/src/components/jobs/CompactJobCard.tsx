import { Link } from "react-router";
import { Briefcase, CalendarClock, DollarSign, MapPin, Trash2 } from "lucide-react";
import type { JobCard } from "@/types";
import translation from "@/utils/translation";

export function CompactJobCard({
  job,
  savedAt,
  onRemove,
  removing,
}: {
  job: JobCard;
  savedAt?: string;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const currency = job.salaryCurrency || "$";
  const salary = job.salaryNegotiable
    ? "Thương lượng"
    : `${job.minSalary?.toLocaleString()} - ${job.maxSalary?.toLocaleString()}${currency}`;

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <Link to={`/job/${job.id}`} className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5">
          <img src={job.companyAvatar || "/assets/images/avatar_default.png"} alt="" className="h-full w-full object-contain" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {job.featured && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Nổi bật</span>}
            {job.urgent && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">Tuyển gấp</span>}
          </div>
          <Link to={`/job/${job.id}`} className="mt-1 block truncate text-base font-bold text-slate-900 hover:text-indigo-600">
            {job.name}
          </Link>
          <div className="text-sm text-slate-500">{job.companyName}</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700">
              <DollarSign size={12} /> {salary}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1">
              <Briefcase size={12} /> {translation[job.workstyle] || job.workstyle}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1">
              <MapPin size={12} /> {job.location?.name || "Không rõ"}
            </span>
            {job.deadline && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1">
                <CalendarClock size={12} /> {new Date(job.deadline).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags?.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {onRemove && (
            <button
              onClick={onRemove}
              disabled={removing}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              title="Bỏ lưu"
            >
              <Trash2 size={16} />
            </button>
          )}
          {savedAt && <span className="text-[11px] text-slate-400">{new Date(savedAt).toLocaleDateString("vi-VN")}</span>}
        </div>
      </div>
    </div>
  );
}
