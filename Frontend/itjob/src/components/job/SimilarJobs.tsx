import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MapPin } from "lucide-react";
import api from "@/utils/api";
import type { JobCard } from "@/types";

const MAX_SIMILAR_JOBS = 3;
const FALLBACK_AVATAR = "/assets/images/avatar_default.png";

interface SimilarJobsProps {
  jobId: number;
  category?: string | null;
  tags?: string[];
}

function formatSalary(job: JobCard): string {
  if (job.salaryNegotiable) return "Thương lượng";
  return `${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}${job.salaryCurrency || "$"}`;
}

export const SimilarJobs = ({ jobId, category, tags = [] }: SimilarJobsProps) => {
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const firstTag = tags[0];

  useEffect(() => {
    if (!category && !firstTag) {
      setJobs([]);
      return;
    }
    const params = category ? { category } : { tags: [firstTag] };
    api
      .get("/jobs", { params, paramsSerializer: { indexes: null } })
      .then((response) => {
        const list: JobCard[] = Array.isArray(response.data) ? response.data : [];
        setJobs(list.filter((job) => job.id !== jobId).slice(0, MAX_SIMILAR_JOBS));
      })
      .catch((error) => {
        console.error("Không tải được việc làm tương tự:", error);
        setJobs([]);
      });
  }, [jobId, category, firstTag]);

  if (jobs.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Việc làm tương tự</h3>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link to={`/job/${job.id}`} className="group flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700">
                <img src={job.companyAvatar || FALLBACK_AVATAR} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  {job.name}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">{job.companyName}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                  <span className="whitespace-nowrap font-semibold text-indigo-700 dark:text-indigo-400">{formatSalary(job)}</span>
                  {job.location?.name && (
                    <span className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{job.location.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
