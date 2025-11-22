import { useEffect, useState } from "react";
import { FaLocationDot, FaPhone } from "react-icons/fa6";
import { CardJobItem } from "../../components/card/CardJobItem";
import { useParams } from 'react-router';
import axios from "axios";
import translation from "@/utils/translation";
export default function CompanyDetailPage() {

  const { id } = useParams();
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
      const companyRes = await axios.get(`${BACKEND_URL}/company/${id}`)
      setInfo(companyRes.data)
      const jobListRes = await axios.get(`${BACKEND_URL}/job/search?companyID=${id}`)
      setJobList(jobListRes.data)
    }
    
    init()
    document.title="Chi tiết công ty";

  },[])
  return (
    <>
      <div className="pt-[30px] pb-[60px]">
        <div className="container">
          {/* Thong tin cong ty  */}
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[16px] items-center">
              <div className="w-[100px] aspect-square rounded-[4px] truncate">
                <img
                  src={info["avatar"]}
                  alt={info["name"]}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:flex-1 w-full">
                <div className="font-bold text-[28px] text-[#121212] mb-[10px]">
                  {info["name"]}
                </div>
                <div className="flex flex-row items-center  gap-[8px] font-[400] text-[14px] text-[#121212]">
                  <FaLocationDot className="text-[16px]" /> {info["address"] ? info["address"] : "Không xác định"}
                  <FaPhone className="text-[16px]" /> {info["phone"] ? info["phone"] : "Không xác định"}
                </div>
              </div>
            </div>
            <div className="mt-[20px] flex flex-col gap-[10px]">
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Mô hình công ty:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  {info["model"] ? translation[info["model"]] : "Không xác định"}
                </div>
              </div>
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Quy mô công ty:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  {info["scale"] ? translation[info["scale"]] : "Không xác định"}
                </div>
              </div>
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Thời gian làm việc:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  {info["startWork"] && info["endWork"] ? `Thứ ${info["startWork"]} - Thứ ${info["endWork"]}` : "Không xác định"}
                </div>
              </div>
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Làm việc ngoài giờ:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  {info["hasOvertime"] != null ? (info["hasOvertime"] ? "Có OT" : "Không có OT") : "Không xác định"}
                </div>
              </div>
            </div>
          </div>
          {/* Mo ta chi tiet  */}
          <div className="rounded-[8px] border border-[#DEDEDE] p-[20px] mt-[20px]">
            Mô tả chi tiết: <br></br>{info["description"] ? info["description"] : "Không có mô tả"}
          </div>
          {/* Viec lam  */}
          <div className="mt-[30px]">
            <h2 className="font-bold text-[28px] text-[#121212] mb-[20px]">
            Công ty có {jobList.length} việc làm
            </h2>
            <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
                {
                jobList.slice((page-1)*6, page*6).map((item, index) => (
                  <CardJobItem key={index} jobInfo={item}/>
                ))
              }
            </div>
                  <div className="mt-[30px]">
        <select onChange={e=>setPage(parseInt(e.target.value))} name="" id="" className="border border-[#DEDEDE] rounded-[8px] py-[12px] px-[18px]">
          {
            Array(Math.ceil(jobList.length/6)).fill(0).map((_, index) => (
              <option value={index+1}>{`Trang ${index+1}`}</option>
            ))
          }
        </select>
      </div>
          </div>
        </div>
      </div>
    </>
  );
}
