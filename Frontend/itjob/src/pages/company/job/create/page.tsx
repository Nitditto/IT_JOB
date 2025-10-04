import { useEffect } from "react"
import { Link } from "react-router";

export default function CompanyManageJobCreatePage() {
  useEffect(()=>{
    document.title="Thêm mới công việc";
  }, [])
  return (
    <>
      <div className="py-[60px]">
        <div className="container mx-auto px-[16px]">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[20px] items-center justify-between mb-[20px]">
              <h1 className="sm:w-auto w-[100%] font-[700] text-[20px] text-black">
                Thêm mới công việc
              </h1>
              <Link to={"#"} className="font-[400] text-[14px] text-[#0088FF] underline">
                Quay lại danh sách
              </Link>
            </div>
            
            <form action="" className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Tên công việc *
                </label>
                <input 
                  type="text" 
                  name="" 
                  id="title" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="">
                <label htmlFor="salaryMin" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mức lương tối thiểu ($)
                </label>
                <input 
                  type="number" 
                  name="" 
                  id="salaryMin" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="">
                <label htmlFor="salaryMax" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mức lương tối đa ($)
                </label>
                <input 
                  type="number" 
                  name="" 
                  id="salaryMax" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="">
                <label htmlFor="position" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Cấp bậc *
                </label>
                <select 
                  name="" 
                  id="position" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                >
                  <option value="">Intern</option>
                  <option value="">Fresher</option>
                  <option value="">Junior</option>
                  <option value="">Middle</option>
                  <option value="">Senior</option>
                  <option value="">Manager</option>
                </select>
              </div>
              <div className="">
                <label htmlFor="workingForm" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Hình thức làm việc *
                </label>
                <select 
                  name="" 
                  id="workingForm" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                >
                  <option value="">Tại văn phòng</option>
                  <option value="">Làm từ xa</option>
                  <option value="">Linh hoạt</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="technologies" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Các công nghệ
                </label>
                <input 
                  type="text" 
                  name="" 
                  id="technologies" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="images" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Danh sách ảnh *
                </label>
                <input 
                  type="file" 
                  name="" 
                  id="images" 
                  accept="image/*" 
                  multiple 
                  className=""
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mô tả chi tiết
                </label>
                <textarea 
                  name="" 
                  id="description" 
                  className="w-[100%] h-[350px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                ></textarea>
              </div>
              <div className="sm:col-span-2">
                <button className="bg-[#0088FF] rounded-[4px] h-[48px] px-[20px] font-[700] text-[16px] text-white">
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}