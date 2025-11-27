
import {Link} from "react-router"
import { FaBriefcase, FaCircle, FaCircleCheck, FaCircleDot, FaCircleQuestion, FaCircleXmark, FaUserTie } from "react-icons/fa6"
import { useEffect, useState } from "react"
import { Pagination } from "../../../../components/pagination/Pagination"
import api from "@/utils/api"
import translation from "@/utils/translation"



export default function UserManageCVListPage() {

  const [cvList, setCVList] = useState([]);
  const [page, setPage] = useState(1);
  useEffect(()=>{

    const init = async () => {
      const cvListRes = await api.get("/cv/list");
      setCVList(cvListRes.data);
    }

    document.title="Quản lý CV đã gửi";
    init();
  },[])

    const renderStatusLabel = (status) => {
    switch(status) {
        case "APPROVED": return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm border border-green-200">Đã Duyệt</span>;
        case "REJECTED": return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm border border-red-200">Đã Từ Chối</span>;
        default: return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-bold text-sm border border-gray-200">Chưa Xem</span>;
    }
  };
  return (
    <>
      <div className="py-[60px]">
        <div className="container mx-auto px-[16px]">
          <h2 className="font-[700] sm:text-[28px] text-[24px] sm:w-auto w-[100%] text-[#121212] mb-[20px]">
            Quản lý CV đã gửi
          </h2>

          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
            {
              cvList.slice((page-1)*6, page*6).map((data, index) => (
<div 
              key={index}
              className="border border-[#DEDEDE] rounded-[8px] flex flex-col relative truncate"
              style={{
                background: "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)"
              }}
            >
              <img 
                src="/assets/images/card-bg.svg" 
                alt="" 
                className="absolute top-[0px] left-[0px] w-[100%] h-auto"
              />
              <h3 className="mt-[20px] mx-[16px] font-[700] text-[18px] text-[#121212] text-center flex-1 whitespace-normal line-clamp-2">
                {data["jobName"]}
              </h3>
              <div className="mt-[12px] text-center font-[400] text-[14px] text-black">
                Công ty: <span className="font-[700]">{data["companyName"]}</span>
              </div>
              <div className="mt-[6px] text-center font-[600] text-[16px] text-[#0088FF]">
                {data["minSalary"].toLocaleString()}$ - {data["maxSalary"].toLocaleString()}$
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaUserTie className="text-[16px]" /> {data["position"]}
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaBriefcase className="text-[16px]" /> {data["workstyle"]}
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                {
                renderStatusLabel(data["status"])
                }
              </div>
              <div className="flex flex-wrap items-center justify-center gap-[8px] mt-[12px] mb-[20px] mx-[10px]">
                <Link to={`/job/${data["jobID"]}/mycv`} className="bg-[#0088FF] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xem
                </Link>
                <Link to="#" className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xóa
                </Link>
              </div>
            </div>
              ))
            }
            
      
          </div>

            {/* Pagination */}
            {cvList.length > 6 && (
              <div className="mt-[30px] flex justify-center">
                <select
                  onChange={(e) => setPage(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {Array(Math.ceil(cvList.length / 6))
                    .fill(0)
                    .map((_, index) => (
                      <option key={index} value={index + 1}>{`Trang ${index + 1}`}</option>
                    ))}
                </select>
              </div>
            )}
        </div>
      </div>
    </>
  )
}