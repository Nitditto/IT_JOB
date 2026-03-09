/* eslint-disable @next/next/no-img-element */

import { Link } from "react-router";
import { FaBriefcase, FaLocationDot, FaUserTie } from "react-icons/fa6";
import translation from "@/utils/translation";
import { DollarSign, Heart } from "lucide-react";
import { useState } from "react";
import { isBookmarked, toggleBookmark, type BookmarkedJob } from "@/utils/bookmarks";

export const CardJobItem = ({ jobInfo }: { jobInfo: any }) => {
  const [saved, setSaved] = useState(isBookmarked(jobInfo.id));

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const bm: BookmarkedJob = {
      id: jobInfo.id,
      name: jobInfo.name,
      companyName: jobInfo.company,
      companyAvatar: jobInfo.companyAvatar,
      minSalary: jobInfo.minSalary,
      maxSalary: jobInfo.maxSalary,
      position: jobInfo.position,
      workstyle: jobInfo.workstyle,
      location: jobInfo.location?.name || '',
      tags: jobInfo.tags || [],
      savedAt: new Date().toISOString(),
    };
    const nowSaved = toggleBookmark(bm);
    setSaved(nowSaved);
  };

  return (
    <Link
      to={`/job/${jobInfo.id}`}
      className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5"
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Bookmark heart */}
      <button
        onClick={handleBookmark}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${saved
            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 scale-110'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
      >
        <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className="relative text-center p-5 pt-6">
        {/* Company Logo */}
        <div
          className="w-20 h-20 mx-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm transition-transform duration-300 group-hover:scale-105 p-2 mb-4"
        >
          <img
            src={jobInfo.companyAvatar}
            className="w-full h-full object-contain"
            alt=""
          />
        </div>

        {/* Job Title */}
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 mx-2 line-clamp-2 leading-snug">
          {jobInfo.name}
        </h3>

        {/* Company Name */}
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          {jobInfo.company}
        </div>

        {/* Salary */}
        <div className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-lg mb-4">
          <DollarSign size={14} />
          {jobInfo.minSalary.toLocaleString() + " - " + jobInfo.maxSalary.toLocaleString() + "$"}
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <FaUserTie className="text-xs text-indigo-400" /> {translation[jobInfo.position]}
          </div>
          <div className="flex items-center justify-center gap-2">
            <FaBriefcase className="text-xs text-violet-400" /> {translation[jobInfo.workstyle]}
          </div>
          <div className="flex items-center justify-center gap-2">
            <FaLocationDot className="text-xs text-emerald-400" /> {jobInfo.location.name}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 flex justify-center flex-wrap gap-1.5">
          {jobInfo.tags.map((value: string, index: number) => (
            <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-full py-1 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              {value}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
