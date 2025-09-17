/* eslint-disable @next/next/no-img-element */
import { FaUserTie } from "react-icons/fa6"

import { Link } from "react-router";
export const CardCompanyItem=()=>{
  return(
    <>
      <Link 
      to={"#"} 
      className="rounded-[8px] border-[1px] border-[#DEDEDE] relative"
      style={{
        background: "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)"
      }}
      >
        <img 
        src="/assets/images/card-bg.svg" 
        alt="" 
        className="absolute top-0 left-0 w-full h-auto" 
        />
        <div className="relative">
          <div 
          className="sm:w-[160px] aspect-square w-[125px] sm:mt-[32px] mt-[20px] sm:mb-[24px] mb-[16px] mx-auto rounded-[8px] bg-white"
          style={{
            boxShadow:"0px 4px 24px 0px #0000001F"
          }}
          >
            <img 
            src="/assets/images/demo-company-1.png" 
            alt="" 
            className="w-full h-full object-contain p-[10px]" 
            />
          </div>
          <h3 
          className="font-bold sm:text-[18px] text-[14px] text-[#121212] sm:mb-[24px] mb-[16px] px-[16px] text-center line-clamp-2"
          >LG Electronics Development Vietnam (LGEDV)</h3>
          <div className="bg-[#F7F7F7] py-[12px] px-[16px] flex items-center sm:justify-between justify-center flex-wrap gap-[12px]">
            <div className="font-[400] text-[14px] text-[#414042]">
              Ho Chi Minh
            </div>
            <div className="inline-flex items-center gap-[6px] font-[400] text-[14px] text-[#121212]">
              <FaUserTie className="text-[16px] text-[#000096]"/> 5 Việc làm
            </div>
          </div>
        </div>
      </Link>
    </>
  )
}