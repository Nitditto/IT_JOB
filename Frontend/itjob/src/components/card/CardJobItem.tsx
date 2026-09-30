/* eslint-disable @next/next/no-img-element */

import { Link } from "react-router";
import { FaBriefcase, FaLocationDot, FaUserTie } from "react-icons/fa6";
import translation from "@/utils/translation";
import { DollarSign, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage, jobEngagementService } from "@/services/jobEngagementService";

export const CardJobItem = ({ jobInfo }: { jobInfo: any }) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const loadState = async () => {
      if (!user || user.role !== "ROLE_USER" || !jobInfo.id) return;
      try {
        const state = await jobEngagementService.getJobState(jobInfo.id);
        if (!ignore) setSaved(state.saved);
      } catch {
        if (!ignore) setSaved(false);
      }
    };
    loadState();
    return () => {
      ignore = true;
    };
  }, [jobInfo.id, user]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.role !== "ROLE_USER") {
      setMessage("Đăng nhập tài khoản ứng viên để lưu việc.");
      window.setTimeout(() => setMessage(null), 2500);
      return;
    }
    setMutating(true);
    try {
      if (saved) {
        await jobEngagementService.unsaveJob(jobInfo.id);
        setSaved(false);
        setMessage("Đã bỏ lưu.");
      } else {
        await jobEngagementService.saveJob(jobInfo.id);
        setSaved(true);
        setMessage("Đã lưu việc.");
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Không thể cập nhật lưu việc."));
    } finally {
      setMutating(false);
      window.setTimeout(() => setMessage(null), 2500);
    }
  };

  return (
    <Link
      to={`/job/${jobInfo.id}`}
      className="group block bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 relative overflow-hidden transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
    >
      {/* Bookmark heart */}
      <button
        onClick={handleBookmark}
        disabled={mutating}
        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border ${saved
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-100 dark:border-rose-900/50 scale-105'
          : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:text-rose-500'
          }`}
      >
        <Heart size={18} fill={saved ? 'currentColor' : 'none'} strokeWidth={saved ? 0 : 2} />
      </button>
      {message && (
        <div className="absolute left-4 right-16 top-4 z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
          {message}
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col items-center gap-6">
          {/* Logo with Filled Border */}
          <div className="relative group/avatar">
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[22px] blur-sm opacity-20 group-hover/avatar:opacity-40 transition-opacity duration-500" />
            <div className="relative w-32 h-32 rounded-2xl p-[3px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 transition-transform duration-500 group-hover:scale-105 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full rounded-[13px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                <img 
                  src={jobInfo.companyAvatar} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt="" 
                />
              </div>
            </div>
          </div>

          <div className="flex-1 text-center  min-w-0 pr-0 ">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
              {jobInfo.name}
            </h3>
            
            <div className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center justify-center  gap-2">
              {jobInfo.company}
            </div>

            <div className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3.5 py-1.5 rounded-xl text-base font-black mb-5">
              <DollarSign size={14} strokeWidth={3} />
              {jobInfo.minSalary.toLocaleString()} - {jobInfo.maxSalary.toLocaleString()}$
            </div>

            <div className="grid grid-cols-1  gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800/50 pt-5">
              <div className="flex items-center justify-center  gap-2">
                <FaUserTie className="text-indigo-500" />
                {translation[jobInfo.position] || jobInfo.position}
              </div>
              <div className="flex items-center justify-center  gap-2">
                <FaBriefcase className="text-violet-500" />
                {translation[jobInfo.workstyle] || jobInfo.workstyle}
              </div>
              <div className="flex items-center justify-center  gap-2">
                <FaLocationDot className="text-emerald-500" />
                {jobInfo.location.name}
              </div>
            </div>

            <div className="mt-5 flex justify-center  flex-wrap gap-2">
              {jobInfo.tags.slice(0, 3).map((v: string, i: number) => (
                <span key={i} className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-lg">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
