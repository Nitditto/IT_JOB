import { useEffect } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { CardJobItem } from "../../../../components/card/CardJobItem";

export default function CompanyDetailPage() {
  useEffect(()=>{
    document.title="Chi tiết công ty";
  },[])
  return (
    <>
      <div className=" pt-[30px] pb-[60px]">
        <div className="container">
          {/* Thong tin cong ty  */}
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[16px] items-center">
              <div className="w-[100px] aspect-square rounded-[4px] truncate">
                <img
                  src="/assets/images/demo-logo-company-1.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:flex-1 w-full">
                <div className="font-bold text-[28px] text-[#121212] mb-[10px]">
                  LG CNS Việt Nam
                </div>
                <div className="flex items-center  gap-[8px] font-[400] text-[14px] text-[#121212]">
                  <FaLocationDot className="text-[16px]" /> Tầng 15, tòa
                  Keangnam Landmark 72, Mễ Trì, Nam Tu Liem, Ha Noi
                </div>
              </div>
            </div>
            <div className="mt-[20px] flex flex-col gap-[10px]">
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Mô hình công ty:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  Sản phẩm
                </div>
              </div>
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Quy mô công ty:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  151 - 300 nhân viên
                </div>
              </div>
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Thời gian làm việc:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  Thứ 2 - Thứ 6
                </div>
              </div>
              <div className="flex items-center gap-[5px]">
                <div className="font-[400] text-[16px] text-[#A6A6A6]">
                  Làm việc ngoài giờ:
                </div>
                <div className="font-[400] text-[16px] text-[#121212] text-right">
                  Không có OT
                </div>
              </div>
            </div>
          </div>
          {/* Mo ta chi tiet  */}
          <div className="rounded-[8px] border border-[#DEDEDE] p-[20px] mt-[20px]">
            Mô tả chi tiết ....
          </div>
          {/* Viec lam  */}
          <div className="mt-[30px]">
            <h2 className="font-bold text-[28px] text-[#121212] mb-[20px]">
            Công ty có 6 việc làm
            </h2>
            <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
              {/* Item  */}
              <CardJobItem/>
              <CardJobItem/>
              <CardJobItem/>
              <CardJobItem/>
              <CardJobItem/>
              <CardJobItem/>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
