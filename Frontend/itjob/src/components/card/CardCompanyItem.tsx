import api from "@/utils/api";
import { useEffect, useState } from "react";
import { FaUserTie } from "react-icons/fa6"

import { Link } from "react-router";
export const CardCompanyItem=({companyInfo}: {companyInfo: any})=>{
  
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const jobCountRes = await api.get(`/jobs?companyID=${companyInfo["id"]}`);
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
        className="group relative block h-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        <div className="absolute top-0 left-0 w-full h-[60px] bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
        
        <div className="relative flex flex-col h-full pt-6">
          <div 
            className="w-[90px] h-[90px] mx-auto rounded-lg bg-white border border-slate-200 dark:border-slate-700 z-10 p-2"
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