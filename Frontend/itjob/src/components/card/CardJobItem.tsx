/* eslint-disable @next/next/no-img-element */

import { Link } from "react-router";
import { FaBriefcase, FaLocationDot, FaUserTie } from "react-icons/fa6";
import translation from "@/utils/translation";

export const CardJobItem = ({jobInfo}: {jobInfo: any}) => {
  return (
    <>
      <Link
        to={`/job/${jobInfo.id}`}
        className="rounded-[8px] border border-[#DEDEDE] relative"
        style={{
          background: "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)",
        }}
      >
        <img
          src="/assets/images/card-bg.svg"
          className="absolute top-0 left-0 w-full h-auto"
          alt=""
        />
        <div className="relative text-center">
          <div
            className="w-[116px] aspect-square mt-[20px] mb-[20px] mx-auto rounded-[8px] bg-white"
            style={{
              boxShadow: "0px 4px 24px 0px #0000001F",
            }}
          >
            <img
              src={jobInfo.logo}
              className="w-full h-full object-contain p-[10px]"
              alt=""
            />
          </div>
          <h3 className="font-[700] text-[18px] text-[#121212] mb-[6px] mx-[16px] line-clamp-2">
            {jobInfo.name}
          </h3>
          <div className="font-[400] text-[14px] text-[#121212] mb-[12px]">
            {jobInfo.company}
          </div>
          <div className="font-[600] text-[16px] text-[#0088FF] mb-[6px]">
            {jobInfo.minSalary.toLocaleString() + "$ - " + jobInfo.maxSalary.toLocaleString() + "$"}
          </div>
          <div className="flex items-center justify-center gap-[8px] mb-[6px] text-[14px]">
            <FaUserTie className="text-[16px]" /> {translation[jobInfo.position]}
          </div>
          <div className="flex items-center justify-center gap-[8px] mb-[6px] text-[14px]">
            <FaBriefcase className="text-[16px]" /> {translation[jobInfo.workstyle]}
          </div>
          <div className="flex items-center justify-center gap-[8px] mb-[6px] text-[14px]">
            <FaLocationDot className="text-[16px]" /> {jobInfo.location.name}
          </div>
          <div className="mt-[12px] mb-[20px] flex justify-center flex-wrap gap-[8px]">
          {jobInfo.tags.map((value, index) => (
            <div key={index} className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]">
              {value}
            </div>))}
          </div>
        </div>
      </Link>
    </>
  );
};
