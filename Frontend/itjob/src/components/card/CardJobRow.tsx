import { Link } from "react-router";
import { DollarSign, MapPin } from "lucide-react";
import translation from "@/utils/translation";
import { useJobBookmark } from "@/hooks/useJobBookmark";
import { BookmarkButton } from "./BookmarkButton";

export const CardJobRow = ({ jobInfo }: { jobInfo: any }) => {
  const { saved, mutating, message, toggleBookmark } = useJobBookmark(jobInfo.id);

  return (
    <Link
      to={`/job/${jobInfo.id}`}
      className="group relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <img src={jobInfo.companyAvatar || "/assets/images/avatar_default.png"} className="h-full w-full object-cover" alt="" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
          {jobInfo.name}
        </h3>
        <div className="truncate text-sm text-slate-500 dark:text-slate-400">{jobInfo.companyName ?? jobInfo.company}</div>
      </div>

      <div className="hidden shrink-0 items-center gap-4 text-sm text-slate-600 dark:text-slate-400 md:flex">
        <span className="inline-flex min-w-40 items-center gap-1 whitespace-nowrap font-semibold text-indigo-700 dark:text-indigo-400">
          <DollarSign size={14} />
          {jobInfo.minSalary.toLocaleString()} - {jobInfo.maxSalary.toLocaleString()}$
        </span>
        <div className="w-36 space-y-0.5">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">{jobInfo.location?.name}</span>
          </span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-500">
            {translation[jobInfo.workstyle] || jobInfo.workstyle}
          </span>
        </div>
      </div>

      <BookmarkButton saved={saved} disabled={mutating} onClick={toggleBookmark} className="shrink-0" />
      {message && (
        <div className="absolute right-16 top-1 z-10 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
          {message}
        </div>
      )}
    </Link>
  );
};
