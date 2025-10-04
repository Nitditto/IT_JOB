import {Link} from "react-router";
import { useEffect } from "react";

export default function CompanyManageCVDetailPage(){
  useEffect(()=>{
    document.title="Chi tiết CV";
  },[])
  return (
    <>
      <div className="py-[60px]">
        <div className="container">
        {/* Thong tin CV  */}
        <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
          <div className="flex flex-wrap gap-[20px] items-center justify-between mb-[20px]">
            <div className="font-bold text-[20px]">
              Thông tin CV
            </div>
            <Link to={"#"} className="text-[#0088FF] font-[400] text-[14px] underline">Quay lại danh sách</Link>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Họ tên: <span className="font-bold">Lê Văn A</span>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Email:<span className="font-bold"> levana@gmail.com</span>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Số điện thoại: <span className="font-bold">0123456789</span>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            File CV:
          </div>
          <div className="bg-[#D9D9D9] h-[736px]">
            {/* Preview file pdf  */}
            <iframe src="https://vi.react.dev/learn/describing-the-ui" className="w-full h-full"></iframe>
          </div>
        </div>
        <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
          <div className="font-bold text-[20px] mb-[20px]">
            Thông tin công việc
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Tên công việc: <span className="font-bold">Frontend Engineer (ReactJS)</span>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Mức lương: <span className="font-bold">1.000$ - 1.500$</span>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Cấp bậc: <span className="font-bold">Fresher</span>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Hình thức làm việc: <span className="font-bold">Tại văn phòng</span>
          </div>
          <div className="font-[400] text-[16px] mb-[10px]">
            Công nghệ: <span className="font-bold">HTML5, CSS3, Javascript, ReactJS</span>
          </div>
          <Link to={"#"} className="text-[#0088FF] font-[400] text-[14px] underline">
            Xem chi tiết công việc
          </Link>
        </div>
        </div>
      </div>
    </>
  )
}