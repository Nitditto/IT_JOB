import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/utils/api";
import type { JobCard } from "@/types";
import { CardJobItem } from "../card/CardJobItem";

const MAX_FEATURED_JOBS = 6;

export const FeaturedJobs = () => {
  const [jobs, setJobs] = useState<JobCard[]>([]);

  useEffect(() => {
    api
      .get("/jobs", { params: { featured: true } })
      .then((response) => {
        const list: JobCard[] = Array.isArray(response.data) ? response.data : [];
        setJobs(list.slice(0, MAX_FEATURED_JOBS));
      })
      .catch((error) => console.error("Không tải được việc làm tiêu điểm:", error));
  }, []);

  if (jobs.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16 dark:bg-slate-950">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Việc làm IT tiêu điểm</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Các vị trí nổi bật và tuyển gấp từ nhà tuyển dụng</p>
          </div>
          <Link to="/search?featured=true" className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            Xem tất cả
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <CardJobItem key={job.id} jobInfo={job} />
          ))}
        </div>
      </div>
    </section>
  );
};
