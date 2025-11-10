//Frontend\itjob\src\pages\search\page.tsx
import api from "@/utils/api";
import { CardJobItem } from "../../components/card/CardJobItem";
import { Pagination } from "../../components/pagination/Pagination";
import { Section1 } from "../../components/section/Section1";
import { useEffect, useState } from "react";
import type {JobFilterParams} from '../../types'
import { useSearchParams } from "react-router";
import axios from "axios";
// const MOCK_JOBS = [
//   {
//     id: 1,
//     name: "Frontend Engineer (ReactJS)",
//     companyName: "LG CNS Việt Nam",
//     companyAvatar: "/assets/images/demo-company-1.png",
//     minSalary: 1000,
//     maxSalary: 1500,
//     position: "fresher",
//     workstyle: "onsite",
//     location: { abbreviation: "HN", name: "Hà Nội" },
//     tags: ["React", "NextJS", "Javascript"]
//   },
//   {
//     id: 2,
//     name: "Backend Developer (NodeJS)",
//     companyName: "FPT Software",
//     companyAvatar: "/assets/images/demo-company-fpt.png",
//     minSalary: 2000,
//     maxSalary: 3000,
//     position: "junior",
//     workstyle: "remote",
//     location: { abbreviation: "SG", name: "Hồ Chí Minh" },
//     tags: ["NodeJS", "TypeScript", "AWS"]
//   },
//   {
//     id: 3,
//     name: "Fullstack Developer (React/Java)",
//     companyName: "MB Bank",
//     companyAvatar: "/assets/images/demo-company-mb.png",
//     minSalary: 1500,
//     maxSalary: 2500,
//     position: "middle",
//     workstyle: "hybrid",
//     location: { abbreviation: "HN", name: "Hà Nội" },
//     tags: ["React", "Java", "Spring Boot"]
//   },
//   {
//     id: 4,
//     name: "Senior React Developer",
//     companyName: "LG CNS Việt Nam",
//     companyAvatar: "/assets/images/demo-company-1.png",
//     minSalary: 3000,
//     maxSalary: 5000,
//     position: "senior",
//     workstyle: "onsite",
//     location: { abbreviation: "ĐNa", name: "Đà Nẵng" },
//     tags: ["React", "TypeScript", "Redux"]
//   }
// ];

export default function SearchPage() {
  
  const [searchParams, setSearchParams] = useSearchParams();
  // const jobInfo = {
  //   id: 0,
  //   name: "Frontend Engineer (ReactJS)",
  //   company: "LG CNS Việt Nam",
  //   logo: "/assets/images/demo-company-1.png",
  //   minSalary: 1000,
  //   maxSalary: 1500,
  //   position: "Fresher",
  //   workstyle: "Tại văn phòng",
  //   location: "Hà Nội",
  //   tags: ["ReactJS", "NextJS", "Javascript"]
  // }
const getFiltersFromURL = (): JobFilterParams => {
  
  // Helper to handle simple strings (converts null to undefined)
  const getString = (key: string): string | undefined => {
    return searchParams.get(key) ?? undefined;
  };

  // Helper to handle numbers (converts null/NaN to undefined)
  const getNumber = (key: string): number | undefined => {
    const value = Number(searchParams.get(key));
    // Will be undefined if value is 0, NaN, or not present
    return value ? value : undefined; 
  };

  // Helper to handle arrays (converts null to undefined, or splits)
  const getArray = (key: string): string[] | undefined => {
    const value = searchParams.getAll(key);
    return value ? value : undefined;
  };

  // Now your return object is clean and type-safe
  return {
    ...(getString('query') && { query: getString('query') }),
    ...(getString('location') && { location: getString('location') }),
    ...(getArray('position') && { position: getArray('position') }),
    ...(getArray('workstyle') && { workstyle: getArray('workstyle') }),
    ...(getNumber('minSalary') && { minSalary: getNumber('minSalary') }),
    ...(getNumber('maxSalary') && { maxSalary: getNumber('maxSalary') }),
    ...(getArray('tags') && { tags: getArray('tags') }),
  };
};
  const [jobList, setJobList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const fetchJobs = async (filters: JobFilterParams) => {
    setIsLoading(true);
    console.log("Đang gọi API với filters:", filters);
    
    try {
      // Gửi request GET với `filters` làm query params
      // Ví dụ: /api/search?query=react&level=fresher&level=junior
      const response = await axios.get(`${BACKEND_URL}/job/search`, { 
        params: filters,
        // Cấu hình để axios gửi mảng đúng cách (quan trọng!)
        paramsSerializer: {
          indexes: null // Gửi ?level=fresher&level=junior
        }
      });
      
      setJobList(response.data); // (Giả sử backend trả về một mảng)
      
    } catch (error) {
      console.error("Lỗi khi fetch jobs:", error);
      setJobList([]); // Xóa list cũ nếu lỗi
    } finally {
      setIsLoading(false);
    }
  };
  

  // 4. SỬ DỤNG useEffect ĐỂ TỰ ĐỘNG GỌI API
  useEffect(() => {
    document.title = "Kết quả tìm kiếm";
    const currentFilters = getFiltersFromURL();
    fetchJobs(currentFilters);
    console.log(jobList);
  }, [searchParams]); // <-- Dependency: Tự động gọi lại API mỗi khi `filters` thay đổi

  
  
  return (
    <>
      {/* Section 1 */}
      <Section1 
      />
      {/*End Section 1 */}

      {/* Kết quả tìm kiếm */}
      <div className="py-[60px]">
        <div className="container">
          <h2 className="font-bold text-[28px] text-[#121212] mb-[30px]">
            {isLoading ? "Đang tìm kiếm..." : `${jobList.length} việc làm tìm thấy`}
          </h2>

          {/* Bộ Lọc  */}
          {/* <div
            className="bg-white rounded-[8px] py-[10px] px-[20px] flex flex-wrap gap-[12px] mb-[30px]"
            style={{
              boxShadow: "0px 4px 20px 0px #0000000F",
            }}
          >
            <select
              name=""
              id=""
              className="w-[148px] h-[36px] rounded-[20px] bg-white border border-[#DEDEDE] px-[18px]  font-[400] text-[16px] text-[#414042]"
            >
              <option value="">Cấp bậc</option>
              <option value="">Intern</option>
              <option value="">Fresher</option>
              <option value="">Junior</option>
              <option value="">Middle</option>
              <option value="">Senior</option>
            </select>
            <select
              name=""
              id=""
              className="w-[206px] h-[36px] rounded-[20px] bg-white border border-[#DEDEDE] px-[18px] font-[400] text-[16px] text-[#414042]"
            >
              <option value="">Hình thức làm việc</option>
              <option value="">Tại văn phòng</option>
              <option value="">Làm từ xa</option>
              <option value="">Linh hoạt</option>
            </select>
          </div> */}

          {/* Danh sách công việc */}
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
            {
              jobList.map((jobInfo, index) => (
                <CardJobItem key={index} jobInfo={jobInfo} />
              ))
            }
          </div>
          
          {/* Phân trang  */}
          <Pagination/>
        </div>
      </div>
      {/* Kết quả tìm kiếm */}
    </>
  );
}
