import { FaBriefcase, FaGlobe, FaLocationDot, FaUserTie } from "react-icons/fa6";
import { Pagination } from "../../../../components/pagination/Pagination";
import { Link, useNavigate } from "react-router"
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import translation from "../../../../utils/translation";
import { Globe } from "lucide-react";
import api from "@/utils/api";

export default function CompanyJobList() {
  const navigate = useNavigate();
  const {user} = useAuth();
  const [jobList, setJobList] = useState([]);
  const [page, setPage] = useState(1);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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

  return (
    <>
      <div className="w-auto mx-8 py-[60px] h-full">
        <div className="flex gap-[20px] flex-wrap items-center justify-between
            mb-[20px]">
          <h1 className="font-bold text-[#121212] text-[28px]">Quản lý công việc</h1>
          <Link to={"./create"} className="bg-[#0088FF] rounded-[4px] py-[8px] px-[20px] font-[400] text-[14px] text-white">Thêm mới</Link>
        </div>
        {/* Danh sach cong viec  */}
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
          {
            jobList.slice((page-1)*6, page*6).map((value, index) => (
          <div
            key={index}
            className="border border-[#DEDEDE] rounded-[8px] flex flex-col relative truncate "
            style={{
              background:
                "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)",
            }}
          >
            <img
              src="/assets/images/card-bg.svg"
              alt=""
              className="absolute top-[0px] left-[0px] w-[100%] h-auto"
            />
            <h3 className="mt-[20px] mx-[16px] font-[700] text-[18px] text-[#121212] text-center flex-1 whitespace-normal line-clamp-2">
              {value.name}
            </h3>
            <div className="mt-[12px] text-center font-[600] text-[16px] text-[#0088FF]">
              {value.minSalary.toLocaleString() + "$ - " + value.maxSalary.toLocaleString() + "$"}
            </div>
            <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
              <FaUserTie className="text-[16px]" /> {translation[value.position]}
            </div>
            <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
              <FaBriefcase className="text-[16px]" /> {translation[value.workstyle]}
            </div>
            <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
              <FaGlobe className="text-[16px]" /> {value.location.name}
            </div>
            <div className="mt-[12px] mb-[20px] mx-[16px] flex flex-wrap justify-center gap-[8px]">
              {value.tags.map((v, i) => (
              <div key={i} className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]">
                {v}
              </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-[12px] mb-[20px]">
              <Link 
              to={`./${value.id}/view`} 
              className="cursor-pointer inline-block rounded-[4px] bg-[#6cb442] px-[20px] py-[8px] text-[14px] font-[400] text-white">
                Xem CV
              </Link>
              <Link
                to={`/dashboard/company/job/${value.id}/edit`}
                className="bg-[#FFB200] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px]"
              >
                Sửa
              </Link>
              <button
                  onClick={() => handleDelete(value.id)} // Gọi hàm xóa
                  className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:bg-red-700 transition-colors"
                >
                  Xóa
              </button>
            </div>
          </div>
            ))

}
        </div>
      <div className="mt-[30px]">
        <select onChange={e=>setPage(e.target.value)} name="" id="" className="border border-[#DEDEDE] rounded-[8px] py-[12px] px-[18px]">
          {
            Array(Math.ceil(jobList.length/6)).fill(0).map((_, index) => (
              <option value={index+1}>{`Trang ${index+1}`}</option>
            ))
          }
        </select>
      </div>
      </div>
    </>
  )
}