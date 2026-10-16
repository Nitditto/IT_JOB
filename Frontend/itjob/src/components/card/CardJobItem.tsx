import { Link } from "react-router";
import { FaBriefcase, FaLocationDot, FaUserTie } from "react-icons/fa6";
import translation from "@/utils/translation";
import { DollarSign } from "lucide-react";
import { useJobBookmark } from "@/hooks/useJobBookmark";
import { BookmarkButton } from "./BookmarkButton";

export const CardJobItem = ({ jobInfo }: { jobInfo: any }) => {
  const { saved, mutating, message, toggleBookmark } = useJobBookmark(jobInfo.id);

  return (
    <Link
      to={`/job/${jobInfo.id}`}
      className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <BookmarkButton saved={saved} disabled={mutating} onClick={toggleBookmark} className="absolute right-4 top-4 z-10" />
      {message && (
        <div className="absolute left-4 right-16 top-4 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
          {message}
        </div>
      )}

      {(jobInfo.urgent || jobInfo.featured) && (
        <div className="absolute left-4 top-4 z-10 flex gap-1.5">
          {jobInfo.urgent && <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">Tuyển gấp</span>}
          {jobInfo.featured && <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Nổi bật</span>}
        </div>
      )}
      <div className="flex flex-col items-center gap-5 p-6">
        <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <img src={jobInfo.companyAvatar} className="h-full w-full object-cover" alt="" />
        </div>

        <div className="min-w-0 flex-1 text-center">
          <h3 className="mb-1 line-clamp-2 text-lg font-semibold leading-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {jobInfo.name}
          </h3>
          <div className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">{jobInfo.companyName ?? jobInfo.company}</div>

          <div className="mb-5 inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
            <DollarSign size={14} strokeWidth={2.5} />
            {jobInfo.minSalary.toLocaleString()} - {jobInfo.maxSalary.toLocaleString()}$
          </div>

          <div className="grid grid-cols-1 gap-2.5 border-t border-slate-100 pt-5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <FaUserTie className="text-slate-400" />
              {translation[jobInfo.position] || jobInfo.position}
            </div>
            <div className="flex items-center justify-center gap-2">
              <FaBriefcase className="text-slate-400" />
              {translation[jobInfo.workstyle] || jobInfo.workstyle}
            </div>
            <div className="flex items-center justify-center gap-2">
              <FaLocationDot className="text-slate-400" />
              {jobInfo.location?.name}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {jobInfo.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};
