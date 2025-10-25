
import { Link } from "react-router";
import { IoMdSearch } from "react-icons/io";
import SearchBar from "./SearchBar";
import type { HomePageData } from "../../types";
import axios from "axios";
import { useEffect, useState } from "react";

export const Section1 = () => {
    const [homePageData, setHomePageData] = useState<HomePageData | null>(null);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    useEffect(() => {
      const init = async () => {
        try {
          const response = await axios.get<HomePageData>(`${BACKEND_URL}`);
          setHomePageData(response.data); 
        } catch (error) {
          console.error("An error occured:\n", error);
        }
      }
  
      init();
    }, [])
  return (
    <>
      <div className="bg-[#000065] py-[60px]">
        <div className="container">
          <h1 className="font-bold text-[28px] text-white mb-[30px] text-center">
            {homePageData ? homePageData.jobCount : 0} Việc làm IT cho Developer &quot;Chất&quot;
          </h1>
          <SearchBar locations={homePageData ? homePageData.locations: []}/>
          <div className="flex items-center gap-x-[12px] flex-wrap gap-y-[15px]">
            <div className="font-[500] text-[16px] text-[#DEDEDE]">
              Mọi người đang tìm kiếm:
            </div>
            <div className="flex gap-[10px] flex-wrap">
              <Link
                to={"#"}
                className="border-[1px] border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] px-[22px] py-[8px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white"
              >
                ReactJS
              </Link>
              <Link
                to={"#"}
                className="border-[1px] border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] px-[22px] py-[8px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white"
              >
                Javascript
              </Link>
              <Link
                to={"#"}
                className="border-[1px] border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] px-[22px] py-[8px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white"
              >
                NodeJS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
