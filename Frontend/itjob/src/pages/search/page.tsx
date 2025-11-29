//Frontend\itjob\src\pages\search\page.tsx
import api from "@/utils/api";
import { CardJobItem } from "../../components/card/CardJobItem";
import { Pagination } from "../../components/pagination/Pagination";
import { Section1 } from "../../components/section/Section1";
import { useEffect, useState } from "react";
import type {JobFilterParams} from '../../types'
import { useSearchParams } from "react-router";
import axios from "axios";


export default function SearchPage() {
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
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
    ...(getNumber('companyID') && {companyID: getNumber('companyID')})
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
    setPage(parseInt(searchParams.get("page") ?? "1"));
    
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

 
          {/* Danh sách công việc */}
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
            {
              jobList.slice((page-1)*6, page*6).map((jobInfo, index) => (
                <CardJobItem key={index} jobInfo={jobInfo} />
              ))
            }
          </div>
          
<Pagination list={jobList} page={page} setPage={setPage} searchParams={searchParams} setSearchParams={setSearchParams} />
        </div>
      </div>
      {/* Kết quả tìm kiếm */}
    </>
  );
}
