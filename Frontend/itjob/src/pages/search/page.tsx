//Frontend\itjob\src\pages\search\page.tsx
import api from "@/utils/api";
import { CardJobItem } from "../../components/card/CardJobItem";
import { Pagination } from "../../components/pagination/Pagination";
import { Section1 } from "../../components/section/Section1";
import { useEffect, useState } from "react";
import type { JobFilterParams } from '../../types'
import { useSearchParams } from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, Briefcase } from "lucide-react";


export default function SearchPage() {

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const getFiltersFromURL = (): JobFilterParams => {
    const getString = (key: string): string | undefined => searchParams.get(key) ?? undefined;
    const getNumber = (key: string): number | undefined => {
      const value = Number(searchParams.get(key));
      return value ? value : undefined;
    };
    const getArray = (key: string): string[] | undefined => {
      const value = searchParams.getAll(key);
      return value ? value : undefined;
    };

    return {
      ...(getString('query') && { query: getString('query') }),
      ...(getString('location') && { location: getString('location') }),
      ...(getArray('position') && { position: getArray('position') }),
      ...(getArray('workstyle') && { workstyle: getArray('workstyle') }),
      ...(getNumber('minSalary') && { minSalary: getNumber('minSalary') }),
      ...(getNumber('maxSalary') && { maxSalary: getNumber('maxSalary') }),
      ...(getArray('tags') && { tags: getArray('tags') }),
      ...(getNumber('companyID') && { companyID: getNumber('companyID') })
    };
  };
  const [jobList, setJobList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const fetchJobs = async (filters: JobFilterParams) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/job/search`, {
        params: filters,
        paramsSerializer: { indexes: null }
      });
      setJobList(response.data);
    } catch (error) {
      console.error("Lỗi khi fetch jobs:", error);
      setJobList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Kết quả tìm kiếm";
    const currentFilters = getFiltersFromURL();
    fetchJobs(currentFilters);
    setPage(parseInt(searchParams.get("page") ?? "1"));
  }, [searchParams]);

  return (
    <div className="bg-background text-foreground transition-colors duration-300">
      {/* Hero Search */}
      <Section1 />

      {/* Results Section */}
      <div className="py-16">
        <div className="container">
          {/* Results Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <Briefcase size={18} className="text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-2xl text-slate-900 dark:text-white">
                {isLoading ? "Đang tìm kiếm..." : `${jobList.length} việc làm tìm thấy`}
              </h2>
              {searchParams.get('query') && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Kết quả cho từ khóa "<span className="text-indigo-600 dark:text-indigo-400 font-medium">{searchParams.get('query')}</span>"
                </p>
              )}
            </div>
          </div>

          {/* Job Cards Grid */}
          {jobList.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5"
            >
              {jobList.slice((page - 1) * 6, page * 6).map((jobInfo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <CardJobItem jobInfo={jobInfo} />
                </motion.div>
              ))}
            </motion.div>
          ) : !isLoading ? (
            <div className="text-center py-20">
              <Search size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-1">Không tìm thấy kết quả</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm</p>
            </div>
          ) : null}

          <Pagination list={jobList} page={page} setPage={setPage} searchParams={searchParams} setSearchParams={setSearchParams} />
        </div>
      </div>
    </div>
  );
}
