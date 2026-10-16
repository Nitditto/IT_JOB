//Frontend\itjob\src\pages\search\page.tsx
import api from "@/utils/api";
import { CardJobItem } from "../../components/card/CardJobItem";
import { CardJobRow } from "../../components/card/CardJobRow";
import { SearchFilterSidebar } from "../../components/search/SearchFilterSidebar";
import { JobAlertWidget } from "../../components/search/JobAlertWidget";
import { Pagination } from "../../components/pagination/Pagination";
import { Section1 } from "../../components/section/Section1";
import { useEffect, useState } from "react";
import type { JobFilterParams } from '../../types'
import { useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Search, Briefcase, MapPin, Tag, UserCheck, DollarSign, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import translation from "@/utils/translation";


type ViewMode = "grid" | "list";
const VIEW_MODE_STORAGE_KEY = "search.viewMode";
const SEARCH_PAGE_SIZE = 12;

const readStoredViewMode = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
};

export default function SearchPage() {

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // chế độ xem chỉ là tiện ích, không lưu được vẫn dùng bình thường
    }
  };
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
      ...(getString('category') && { category: getString('category') }),
      ...(getArray('employmentType') && { employmentType: getArray('employmentType') }),
      ...(searchParams.get('featured') === 'true' && { featured: true }),
      ...(searchParams.get('urgent') === 'true' && { urgent: true }),
      ...(getNumber('companyID') && { companyID: getNumber('companyID') })
    };
  };
  const [jobList, setJobList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchJobs = async (filters: JobFilterParams) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/jobs`, {
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
          <div className="flex items-start gap-3 mb-8">
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
              {searchParams.toString() && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {[...searchParams.entries()].map(([key, value], index) => {
                    if (key === 'page') return null;
                    
                    let label = "";
                    let icon = null;
                    
                    switch (key) {
                      case 'query':
                        label = `Từ khóa: ${value}`;
                        icon = <Search size={12} />;
                        break;
                      case 'location':
                        label = `Địa điểm: ${value}`;
                        icon = <MapPin size={12} />;
                        break;
                      case 'position':
                        label = `Cấp bậc: ${translation[value] || value}`;
                        icon = <UserCheck size={12} />;
                        break;
                      case 'workstyle':
                        label = `Hình thức: ${translation[value] || value}`;
                        icon = <Briefcase size={12} />;
                        break;
                      case 'minSalary':
                        // Only show range if both min and max exist to avoid redundancy
                        if (searchParams.has('maxSalary')) return null;
                        label = `Lương từ: ${value}$`;
                        icon = <DollarSign size={12} />;
                        break;
                      case 'maxSalary':
                        const min = searchParams.get('minSalary');
                        label = min ? `Lương: ${min}$ - ${value}$` : `Lương đến: ${value}$`;
                        icon = <DollarSign size={12} />;
                        break;
                      case 'tags':
                        label = `Lĩnh vực: ${value}`;
                        icon = <Tag size={12} />;
                        break;
                      default:
                        return null;
                    }

                    return (
                      <div key={index} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">
                        {icon}
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="ml-auto flex shrink-0 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="Chế độ xem">
              {([["list", List, "Danh sách"], ["grid", LayoutGrid, "Lưới"]] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  aria-label={label}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-5 lg:sticky lg:top-24">
              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <SlidersHorizontal size={16} />
                {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              </button>
              <div className={`${showFilters ? "block" : "hidden"} space-y-5 lg:block`}>
                <SearchFilterSidebar searchParams={searchParams} setSearchParams={setSearchParams} />
                <JobAlertWidget searchParams={searchParams} />
              </div>
            </div>

            <div className="min-w-0">
          {/* Job Cards */}
          {jobList.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={viewMode === "grid" ? "grid sm:grid-cols-2 grid-cols-1 gap-5" : "flex flex-col gap-3"}
            >
              {jobList.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE).map((jobInfo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  {viewMode === "grid" ? <CardJobItem jobInfo={jobInfo} /> : <CardJobRow jobInfo={jobInfo} />}
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

          <Pagination list={jobList} pageSize={SEARCH_PAGE_SIZE} page={page} setPage={setPage} searchParams={searchParams} setSearchParams={setSearchParams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
