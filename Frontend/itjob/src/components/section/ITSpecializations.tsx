import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BrainCircuit,
  Briefcase,
  Bug,
  Cloud,
  Code2,
  Cpu,
  Package,
  Palette,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import api from "@/utils/api";
import type { JobCard } from "@/types";

const MAX_SPECIALIZATIONS = 8;
const MAX_SAMPLE_TAGS = 3;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Software Development": Code2,
  "Data & AI": BrainCircuit,
  DevOps: Cloud,
  Mobile: Smartphone,
  Security: ShieldCheck,
  "Quality Assurance": Bug,
  Design: Palette,
  Embedded: Cpu,
  Product: Package,
};

interface Specialization {
  name: string;
  jobCount: number;
  sampleTags: string[];
}

function groupByCategory(jobs: JobCard[]): Specialization[] {
  const tagCountsByCategory = new Map<string, Map<string, number>>();
  const jobCountByCategory = new Map<string, number>();

  for (const job of jobs) {
    if (!job.category) continue;
    jobCountByCategory.set(job.category, (jobCountByCategory.get(job.category) ?? 0) + 1);
    const tagCounts = tagCountsByCategory.get(job.category) ?? new Map<string, number>();
    for (const tag of job.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    tagCountsByCategory.set(job.category, tagCounts);
  }

  return [...jobCountByCategory.entries()]
    .map(([name, jobCount]) => ({
      name,
      jobCount,
      sampleTags: [...(tagCountsByCategory.get(name) ?? new Map()).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_SAMPLE_TAGS)
        .map(([tag]) => tag),
    }))
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, MAX_SPECIALIZATIONS);
}

export const ITSpecializations = () => {
  const [jobs, setJobs] = useState<JobCard[]>([]);

  useEffect(() => {
    api
      .get("/jobs")
      .then((response) => setJobs(Array.isArray(response.data) ? response.data : []))
      .catch((error) => console.error("Không tải được danh sách việc làm:", error));
  }, []);

  const specializations = useMemo(() => groupByCategory(jobs), [jobs]);

  if (specializations.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Khám phá theo chuyên môn IT</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chọn lĩnh vực bạn quan tâm để xem việc làm phù hợp</p>
          </div>
          <Link to="/search" className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {specializations.map((item) => {
            const Icon = CATEGORY_ICONS[item.name] ?? Briefcase;
            return (
              <Link
                key={item.name}
                to={`/search?category=${encodeURIComponent(item.name)}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.jobCount} việc làm</div>
                  </div>
                </div>
                {item.sampleTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.sampleTags.map((tag) => (
                      <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
