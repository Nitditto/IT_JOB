import { useEffect } from "react"
import { setupRegisterValidation } from '../../../utils/validateForms';
export default function CompanyRegisterPage(){
  useEffect(()=>{
    document.title="Đăng ký (Nhà tuyển dụng)";
  },[])
  useEffect(() => {
    setupRegisterValidation('#register-form');
  }, []);
  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <div className="rounded-[8px] border border-[#DEDEDE] px-[20px] py-[50px] max-w-[602px] mx-auto">
            <h1 className="font-bold text-[20px] mb-[20px] text-black text-center">
              Đăng ký (Nhà tuyển dụng)
            </h1>
            <form id="register-form" action="" className="grid grid-cols-1 gap-x-[20px] gap-y-[15px]">
              <div className="">
                <label
                  htmlFor="companyName"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Tên công ty *
                </label>
                <input
                  type="text"
                  name=""
                  id="fullName"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="">
                <label
                  htmlFor="email"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Email *
                </label>
                <input
                  type="text"
                  name=""
                  id="email"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="">
                <label
                  htmlFor="password"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name=""
                  id="password"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="">
                <button className="px-[20px] w-full h-[48px] bg-[#0088FF] rounded-[4px] font-bold text-[16px] text-white cursor-pointer">
                  Đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}