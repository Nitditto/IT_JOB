import {Link} from "react-router"
import { FaBriefcase, FaCircleCheck, FaEnvelope, FaEye, FaPhone, FaUserTie } from "react-icons/fa6"
import { useEffect } from "react"
import { Pagination } from "../../../../components/pagination/Pagination";


export default function CompanyManageCVListPage() {
  useEffect(()=>{
    document.title="Quản lý CV";
  },[])
  return (
    <>
      <div className="w-[90%] mx-8 py-[60px] ">
        <div className="flex gap-[20px] flex-wrap items-center justify-between
            mb-[20px]">
          <h1 className="font-bold text-[#121212] text-[28px]">
            Quản lý CV
          </h1>
      </div>

          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
            <div 
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
                Frontend Engineer (ReactJS)
              </h3>
              <div className="mt-[12px] text-center font-[400] text-[14px] text-black">
                Ứng viên: <span className="font-[700]">Lê Văn A</span>
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaEnvelope className="" /> levana@gmail.com
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaPhone className="" /> 0123456789
              </div>
              <div className="mt-[12px] text-center font-[600] text-[16px] text-[#0088FF]">
                1.000$ - 1.500$
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaUserTie className="text-[16px]" /> Fresher
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaBriefcase className="text-[16px]" /> Tại văn phòng
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#FF0000]">
                <FaEye className="text-[16px]" /> Chưa xem
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaCircleCheck className="text-[16px]" /> Chưa duyệt
              </div>
              <div className="flex flex-wrap items-center justify-center gap-[8px] mt-[12px] mb-[20px] mx-[10px]">
                <Link to={"#"} className="bg-[#0088FF] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xem
                </Link>
                <Link to={"#"} className="bg-[#9FDB7C] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px]">
                  Duyệt
                </Link>
                <Link to={"#"} className="bg-[#FF5100] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Từ chối
                </Link>
                <Link to={"#"} className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xóa
                </Link>
              </div>
            </div>
            <div 
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
                Frontend Engineer (ReactJS)
              </h3>
              <div className="mt-[12px] text-center font-[400] text-[14px] text-black">
                Ứng viên: <span className="font-[700]">Lê Văn A</span>
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaEnvelope className="" /> levana@gmail.com
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaPhone className="" /> 0123456789
              </div>
              <div className="mt-[12px] text-center font-[600] text-[16px] text-[#0088FF]">
                1.000$ - 1.500$
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaUserTie className="text-[16px]" /> Fresher
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaBriefcase className="text-[16px]" /> Tại văn phòng
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaEye className="text-[16px]" /> Đã xem
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#47BE02]">
                <FaCircleCheck className="text-[16px]" /> Đã duyệt
              </div>
              <div className="flex flex-wrap items-center justify-center gap-[8px] mt-[12px] mb-[20px] mx-[10px]">
                <Link to={"#"} className="bg-[#0088FF] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xem
                </Link>
                {/* <Link to={"#"} className=" bg-[#9FDB7C] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px]">
                  Duyệt
                </Link> */}
                <Link to={"#"} className="bg-[#FF5100] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Từ chối
                </Link>
                <Link to={"#"} className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xóa
                </Link>
              </div>
            </div>
            <div 
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
                Frontend Engineer (ReactJS)
              </h3>
              <div className="mt-[12px] text-center font-[400] text-[14px] text-black">
                Ứng viên: <span className="font-[700]">Lê Văn A</span>
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaEnvelope className="" /> levana@gmail.com
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaPhone className="" /> 0123456789
              </div>
              <div className="mt-[12px] text-center font-[600] text-[16px] text-[#0088FF]">
                1.000$ - 1.500$
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaUserTie className="text-[16px]" /> Fresher
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaBriefcase className="text-[16px]" /> Tại văn phòng
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaEye className="text-[16px]" /> Đã xem
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#FF5100]">
                <FaCircleCheck className="text-[16px]" /> Từ chối
              </div>
              <div className="flex flex-wrap items-center justify-center gap-[8px] mt-[12px] mb-[20px] mx-[10px]">
                <Link to={"#"} className="bg-[#0088FF] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xem
                </Link>
                <Link to={"#"} className="bg-[#9FDB7C] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px]">
                  Duyệt
                </Link>
                <Link to={"#"} className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]">
                  Xóa
                </Link>
              </div>
            </div>
          </div>

          <Pagination />

        </div>
    </>
  )
}