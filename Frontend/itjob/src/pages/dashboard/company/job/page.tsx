import { FaBriefcase, FaUserTie } from "react-icons/fa6";
import { Pagination } from "../../../../components/pagination/Pagination";
import { Link, useSearchParams, useNavigate } from "react-router"
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import translation from "../../../../utils/translation";
import { Globe } from "lucide-react";
import api from "@/utils/api";

export default function CompanyJobList() {
  const navigate = useNavigate();
  const {user} = useAuth();
  const [ searchParams, setSearchParams ] = useSearchParams();
  const [jobList, setJobList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const fetchJobs = async () => {
    try {
      const response = await api.get(`/job/search`, {
        params: { companyID: user?.id },
      });
      setJobList(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    document.title = "Quản lý công việc";
    if (user?.id) fetchJobs(); // Gọi hàm load

  }, [user]);

  useEffect(()=>{
    setPage(parseInt(searchParams.get("page") ?? "1"));
  }, [])

  // 2. Hàm xử lý Xóa
  const handleDelete = async (jobId: number) => {
    // Hỏi xác nhận
    if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này không? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      // Gọi API xóa (dùng axios instance có kèm token/cookie để backend check role)
      await api.delete(`/job/${jobId}`);

      // Thông báo thành công
      alert("Đã xóa thành công!");
      navigate("/");
      fetchJobs();
      
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data || "Có lỗi xảy ra khi xóa!");
    }
  };

  // 3. Search Filter State
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = jobList.filter((job: any) => 
    job.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="p-4 md:p-8 h-full bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header Area */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="font-bold text-slate-900 text-2xl">Quản lý công việc</h1>
              <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi các tin tuyển dụng của công ty bạn.</p>
            </div>
            <Link 
              to={"./create"} 
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg py-2.5 px-5 font-medium text-sm text-white shadow-sm flex items-center gap-2"
            >
              <Globe size={18} />
              Thêm mới tin
            </Link>
          </div>

          {/* Controls Area */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="relative w-full sm:w-80">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm theo tiêu đề..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             <div className="text-sm text-slate-500 font-medium">
               Tổng số: <span className="text-slate-900 font-bold">{filteredJobs.length}</span> công việc
             </div>
          </div>

          {/* Job List Grid */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {
              filteredJobs.slice((page-1)*6, page*6).map((value: any, index: number) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                         <FaBriefcase /> {translation[value.workstyle as keyof typeof translation]}
                      </div>
                      <span className="text-xs text-slate-400 font-medium pl-2">{value.location.name}</span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                      {value.name}
                    </h3>

                    <div className="font-semibold text-[15px] text-emerald-600 mb-4">
                      {value.minSalary.toLocaleString() + "$ - " + value.maxSalary.toLocaleString() + "$"}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                       <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 rounded-md px-2 py-1">
                          <FaUserTie /> {translation[value.position as keyof typeof translation]}
                       </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {value.tags.slice(0, 3).map((v: string, i: number) => (
                        <div key={i} className="rounded-full bg-slate-50 border border-slate-200 py-1 px-3 font-medium text-xs text-slate-500">
                          {v}
                        </div>
                      ))}
                      {value.tags.length > 3 && (
                        <div className="rounded-full bg-slate-50 border border-slate-200 py-1 px-2 font-medium text-xs text-slate-400">
                          +{value.tags.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-slate-100 p-3 bg-slate-50/50 flex items-center justify-end gap-2">
                    <Link 
                      to={`./${value.id}/view`} 
                      title="Xem CV Ứng Tuyển"
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </Link>
                    <Link
                      to={`/dashboard/company/job/${value.id}/edit`}
                      title="Sửa"
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </Link>
                    <button
                        onClick={() => handleDelete(value.id)}
                        title="Xóa"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            }
          </div>

          <div className="mt-8">
            <Pagination list={filteredJobs} page={page} setPage={setPage} searchParams={searchParams} setSearchParams={setSearchParams} />
          </div>
        </div>
      </div>
    </>
  )
}