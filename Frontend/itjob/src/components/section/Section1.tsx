//Frontend\itjob\src\components\section\Section1.tsx
import { Link } from "react-router";
import { IoMdSearch } from "react-icons/io";
import SearchBar from "./SearchBar";
// import type { HomePageData } from "../../types";
import axios from "axios";
import { useEffect, useState } from "react";
import type { Location, Tag } from "../../types"; 

export const Section1 = () => {
    const [jobCount, setJobCount] = useState(0);
    const [location, setLocation] = useState<Location[]>([]);
    const [tags, setTags] = useState([]);
    const [companyList, setCompanyList] = useState([]);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    useEffect(() => {
      const init = async () => {
        try {
          const jobCountRes = await axios.get(`${BACKEND_URL}/job/count`);
          const locationRes = await axios.get(`${BACKEND_URL}/location`);
          const tagRes = await axios.get(`${BACKEND_URL}/job/tags`);
          const companyRes = await axios.get(`${BACKEND_URL}/company/list`);
          setJobCount(jobCountRes.data);
          setLocation(locationRes.data);
          setTags(tagRes.data);
          setCompanyList(companyRes.data);
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
            {jobCount} Việc làm IT cho Developer &quot;Chất&quot;
          </h1>
          <SearchBar 
            locations={location}
            tags={tags}
            companyList={companyList}/>
          <div className="flex items-center gap-x-3 flex-wrap gap-y-[15px]">
            <div className="font-medium text-[16px] text-[#DEDEDE]">
              Mọi người đang tìm kiếm:
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {
                tags.slice(0, 3).map((value: Tag, index:number) => (
              <Link
                key={index}
                to={`/search?tags=${value.tag}`}
                className="border border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] px-[22px] py-2 font-medium text-[16px] text-[#DEDEDE] hover:text-white"
              >
                {value.tag}
              </Link>
                ))
              }

            </div>
          </div>
        </div>
      </div>
    </>
  );
};
