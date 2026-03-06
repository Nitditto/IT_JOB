
import {Link, useNavigate, useSearchParams} from "react-router"
import { FaBriefcase, FaCircleCheck, FaCircleDot, FaCircleXmark, FaUserTie } from "react-icons/fa6"
import { useEffect, useState } from "react"
import { Pagination } from "../../../../components/pagination/Pagination"
import api from "@/utils/api"



export default function UserManageCVListPage() {

  const [cvList, setCVList] = useState([]);
  const [ searchParams, setSearchParams ] = useSearchParams();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  useEffect(()=>{

    const init = async () => {
      const cvListRes = await api.get("/cv/list");
      setCVList(cvListRes.data);
    }

    document.title="Quản lý CV đã gửi";
    init();
    setPage(parseInt(searchParams.get("page") ?? "1"));
  },[])

    const renderStatusLabel = (status: string) => {
    switch(status) {
        case "APPROVED": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200"><FaCircleCheck size={10} /> Đã Duyệt</span>;
        case "REJECTED": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium text-xs border border-red-200"><FaCircleXmark size={10} /> Từ Chối</span>;
        default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium text-xs border border-amber-200"><FaCircleDot size={10} /> Chưa Duyệt</span>;
    }
  };

    const handleDeleteCV = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa CV không? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await api.delete(`/cv/${id}/delete`);
      alert("Đã xóa thành công!"); 
      navigate("/");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data || "Có lỗi xảy ra khi xóa!");
    }
  }

  return (
    <>
      <div className="p-4 md:p-8 h-full bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header Area */}
          <div className="mb-8">
            <h1 className="font-bold text-slate-900 text-2xl">Quản lý CV đã gửi</h1>
            <p className="text-slate-500 text-sm mt-1">Theo dõi trạng thái các hồ sơ ứng tuyển của bạn tại đây.</p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {
              cvList.slice((page-1)*6, page*6).map((data: any, index: number) => (
              <div 
                key={index}
                className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group relative"
              >
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                        {data.companyName}
                      </span>
                      {renderStatusLabel(data.status)}
                    </div>
                    
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                      {data.jobName}
                    </h3>

                    <div className="font-semibold text-[15px] text-emerald-600 mb-4">
                      {data.minSalary.toLocaleString()}$ - {data.maxSalary.toLocaleString()}$
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-auto">
                        <div className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <FaUserTie className="text-slate-400" /> {data.position}
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                           <FaBriefcase className="text-slate-400" /> {data.workstyle}
                        </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-slate-100 p-3 bg-slate-50/50 flex items-center justify-end gap-2">
                    <Link 
                      to={`/job/${data.jobID}/mycv`} 
                      className="text-sm font-medium px-4 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Chi tiết CV
                    </Link>
                    <button 
                      onClick={() => handleDeleteCV(data.jobID)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa ứng tuyển"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
              </div>
              ))
            }
          </div>

          <div className="mt-8">
             <Pagination list={cvList} page={page} setPage={setPage} searchParams={searchParams} setSearchParams={setSearchParams} />
          </div>
        </div>
      </div>
    </>
  )
}