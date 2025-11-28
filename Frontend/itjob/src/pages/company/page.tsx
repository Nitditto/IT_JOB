import { useEffect, useState } from "react";
import { FaBuilding, FaBusinessTime, FaClock, FaLocationDot, FaPhone, FaUsers } from "react-icons/fa6";
import { CardJobItem } from "../../components/card/CardJobItem";
import { useParams, useSearchParams } from 'react-router';
import axios from "axios";
import translation from "@/utils/translation";
import { Pagination } from "@/components/pagination/Pagination";
export default function CompanyDetailPage() {

  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [info, setInfo] = useState({
    name: "",
    avatar: "",
    phone: "",
    address: "",
    location: "",
    model: "",
    scale: "",
    startWork: 0,
    endWork: 0,

    hasOvertime: null,
    description: "",
  })
  const [jobList, setJobList] = useState([])
  const [page, setPage] = useState(1);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  useEffect(()=>{
    const init = async () => {
      try {
        const companyRes = await axios.get(`${BACKEND_URL}/company/${id}`);
        setInfo(companyRes.data);
        const jobListRes = await axios.get(`${BACKEND_URL}/job/search?companyID=${id}`);
        setJobList(jobListRes.data);
        setPage(parseInt(searchParams.get("page") ?? "1"));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    init();
    document.title = "Chi tiết công ty";

  },[id])

  const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="text-blue-600 text-xl mt-1">{icon}</div>
      <div>
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className="text-base font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
  
  return (
    <>
      <div className="bg-gray-50 min-h-screen pt-[30px] pb-[60px]">
        <div className="container mx-auto px-4">
          {/* Card Thông tin chung */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header Cover - Có thể thêm ảnh bìa nếu muốn, hiện tại để dải màu */}
            <div className="h-24 bg-gradient-to-r from-blue-800 to-cyan-500"></div>
            
            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
                {/* Avatar */}
                <div className="w-[120px] h-[120px] rounded-xl border-4 border-white shadow-md bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={info["avatar"] || "https://via.placeholder.com/150"}
                    alt={info["name"]}
                    className="w-full h-full object-contain p-2"
                  />
                </div>

                {/* Tên & Liên hệ */}
                <div className="flex-1 mt-4 md:mt-14">
                  <h1 className="font-bold text-3xl text-gray-900 mb-3">
                    {info["name"]}
                  </h1>
                  
                  <div className="flex flex-wrap gap-y-2 gap-x-6 text-gray-600 text-sm">
                    <div className="flex items-center gap-2">
                      <FaLocationDot className="text-blue-500" />
                      <span>{info["address"] ? info["address"] : "Địa chỉ chưa cập nhật"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-blue-500" />
                      <span>{info["phone"] ? info["phone"] : "SĐT chưa cập nhật"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              {/* Grid Thông tin chi tiết */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoItem 
                  icon={<FaBuilding />} 
                  label="Mô hình công ty" 
                  value={info["model"] ? translation[info["model"]] : "Chưa cập nhật"} 
                />
                <InfoItem 
                  icon={<FaUsers />} 
                  label="Quy mô nhân sự" 
                  value={info["scale"] ? translation[info["scale"]] : "Chưa cập nhật"} 
                />
                <InfoItem 
                  icon={<FaClock />} 
                  label="Thời gian làm việc" 
                  value={info["startWork"] && info["endWork"] ? `Thứ ${info["startWork"]} - Thứ ${info["endWork"]}` : "Chưa cập nhật"} 
                />
                <InfoItem 
                  icon={<FaBusinessTime />} 
                  label="Làm việc ngoài giờ" 
                  value={info["hasOvertime"] != null ? (info["hasOvertime"] ? "Có OT" : "Không có OT") : "Chưa cập nhật"} 
                />
              </div>
            </div>
          </div>

          {/* Card Mô tả chi tiết */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="font-bold text-xl text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">
              Giới thiệu công ty
            </h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
              {info["description"] ? info["description"] : "Chưa có thông tin mô tả chi tiết về công ty này."}
            </div>
          </div>

          {/* --- KẾT THÚC PHẦN SỬA GIAO DIỆN --- */}

          {/* Viec lam */}
          <div className="mt-[30px]">
            <h2 className="font-bold text-[28px] text-[#121212] mb-[20px]">
            Công ty có {jobList.length} việc làm
            </h2>
            
            <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
              {jobList.slice((page - 1) * 6, page * 6).map((item, index) => (
                <CardJobItem key={index} jobInfo={item} />
              ))}
            </div>
            
<Pagination list={jobList} page={page} setPage={setPage} searchParams={searchParams} setSearchParams={setSearchParams}/>
          </div>
        </div>
      </div>
    </>
  );
}