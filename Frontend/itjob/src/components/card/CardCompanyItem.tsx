import api from "@/utils/api";
import { useEffect, useState } from "react";
import { FaUserTie } from "react-icons/fa6"

import { Link } from "react-router";
export const CardCompanyItem=({companyInfo}: {companyInfo: any})=>{
  
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const jobCountRes = await api.get(`/job/search?companyID=${companyInfo["id"]}`);
        const jobsData = Array.isArray(jobCountRes.data.data)
          ? jobCountRes.data.data
          : Array.isArray(jobCountRes.data)
            ? jobCountRes.data
            : []
        setJobCount(jobsData.length);
      } catch (err) {
        console.error(`Error fetching job count for company ${companyInfo["id"]}:`, err)
      }
    }

    init()
  }, [])
  return (
    <>
      <Link
        to={`/company/${companyInfo["id"]}`}
        className="group rounded-[16px] bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(129,140,248,0.2)]"
      >
        <div className="absolute top-0 left-0 w-full h-[60px] bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 rounded-t-[16px]" />
        
        <div className="relative flex flex-col h-full pt-6">
          <div 
            className="w-[90px] h-[90px] mx-auto rounded-[12px] bg-white border border-slate-100 dark:border-slate-800 shadow-sm transition-transform duration-300 group-hover:scale-105 z-10 p-2"
          >
            <img 
              src={companyInfo["avatar"]}
              alt={companyInfo["name"]} 
              className="w-full h-full object-contain" 
            />
          </div>
          
          <div className="flex-1 px-4 pt-4 pb-0 flex flex-col items-center">
            <h3 className="font-bold text-[16px] xl:text-[18px] text-foreground text-center line-clamp-2 leading-tight">
              {companyInfo["name"]} 
            </h3>
          </div>
          
          <div className="mt-5 bg-slate-50 dark:bg-slate-800/50 py-[12px] px-[16px] flex items-center justify-between gap-[8px] border-t border-slate-100 dark:border-slate-800/50 text-sm">
            <div className="font-medium text-slate-500 dark:text-slate-400 truncate max-w-[50%]">
              {companyInfo["location"] ? companyInfo["location"]["name"] : "Không xác định"}
            </div>
            <div className="inline-flex items-center gap-[6px] font-semibold text-primary">
              <FaUserTie className="text-[14px]"/> {jobCount} Việc làm
            </div>
          </div>
        </div>
      </Link>
              
    </>
  )
}