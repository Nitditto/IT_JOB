import { useEffect } from "react"
export default function UserManageProfilePage() {
  useEffect(()=>{
    document.title="Thông tin cá nhân";
  },[])
  return (
    <>
      <div className="py-[60px]">
        <div className="container mx-auto px-[16px]">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <h1 className="font-[700] text-[20px] text-black mb-[20px]">
              Thông tin cá nhân
            </h1>
            <form action="" className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Họ tên *
                </label>
                <input 
                  type="text" 
                  name="" 
                  id="fullName" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="avatar" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Avatar
                </label>
                <input 
                  type="file" 
                  name="" 
                  id="avatar" 
                  accept="image/*" 
                  className=""
                />
              </div>
              <div className="">
                <label htmlFor="email" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Email *
                </label>
                <input 
                  type="email" 
                  name="" 
                  id="email" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="">
                <label htmlFor="phone" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Số điện thoại
                </label>
                <input 
                  type="text" 
                  name="" 
                  id="phone" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="sm:col-span-2">
                <button className="bg-[#0088FF] rounded-[4px] h-[48px] px-[20px] font-[700] text-[16px] text-white">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}