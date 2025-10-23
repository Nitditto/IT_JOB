import { Link } from "react-router";
import { useEffect } from "react";
import { FaBriefcase, FaUserTie } from "react-icons/fa6";
import { Pagination } from "../../../../components/pagination/Pagination";

export default function CompanyManageJobListPage() {
  useEffect(() => {
    document.title = "Quản lý công việc";
  }, []);
  const logo = {
    logo_sidebar:"/assets/images/logo_sidebar.svg"
  }
  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <div className="flex gap-[20px] flex-wrap items-center justify-between
          mb-[20px]">
            <h1 className="font-bold text-[#121212] text-[28px]">Quản lý công việc</h1>
            <Link to="#" className="bg-[#0088FF] rounded-[4px] py-[8px] px-[20px] font-[400] text-[14px] text-white">Thêm mới</Link>
          </div>

          {/* Danh sach cong viec  */}
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
            <div
              className="border border-[#DEDEDE] rounded-[8px] flex flex-col relative truncate"
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
                Frontend Engineer (ReactJS)
              </h3>
              <div className="mt-[12px] text-center font-[600] text-[16px] text-[#0088FF]">
                1.000$ - 1.500$
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaUserTie className="text-[16px]" /> Fresher
              </div>
              <div className="mt-[6px] flex justify-center items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                <FaBriefcase className="text-[16px]" /> Tại văn phòng
              </div>
              <div className="mt-[12px] mb-[20px] mx-[16px] flex flex-wrap justify-center gap-[8px]">
                <div className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]">
                  ReactJS
                </div>
                <div className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]">
                  NextJS
                </div>
                <div className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]">
                  Javascript
                </div>
              </div>
              <div className="flex items-center justify-center gap-[12px] mb-[20px]">
                <Link
                  to="#"
                  className="bg-[#FFB200] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px]"
                >
                  Sửa
                </Link>
                <Link
                  to="#"
                  className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px]"
                >
                  Xóa
                </Link>
              </div>
            </div>
          </div>
          <Pagination/>
        </div>
      </div>
    </>
  );
}
