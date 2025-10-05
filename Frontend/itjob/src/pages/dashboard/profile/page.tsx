import { useEffect } from "react";

export default function CompanyManageProfilePage() {
  useEffect(() => {
    document.title = "Danh sách công ty";
  }, []);
  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <div className="rounded-[8px] border border-[#DEDEDE] p-[20px]">
            <h2 className="font-bold text-[20px] mb-[20px] text-black">
              Thông tin công ty
            </h2>
            <form action="" className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]">
              <div className="sm:col-span-2">
                <label
                  htmlFor="companyName"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Tên công ty *
                </label>
                <input
                  type="text"
                  name=""
                  id="companyName"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="logo"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Logo
                </label>
                <input
                  type="file"
                  name=""
                  id="logo"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px] file:py-[12px]"
                />
              </div>
              <div className="">
                <label
                  htmlFor="city"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                 Thành phố
                </label>
                <select name="" id="city" className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]">
                  <option value="">Hà Nội</option>
                  <option value="">Đà Nẵng</option>
                  <option value="">Hồ Chí Minh</option>
                </select>
              </div>
              <div className="">
                <label
                  htmlFor="address"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                 Địa chỉ
                </label>
                <input
                  type="text"
                  name=""
                  id="address"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="">
                <label
                  htmlFor="companyModel"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Mô hình công ty
                </label>
                <input
                  type="text"
                  name=""
                  id="companyModel"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="">
                <label
                  htmlFor="companyEmployess"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                 Quy mô công ty
                </label>
                <input
                  type="text"
                  name=""
                  id="companyEmployess"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="">
                <label
                  htmlFor="workTime"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                 Thời gian làm việc
                </label>
                <input
                  type="text"
                  name=""
                  id="workTime"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="">
                <label
                  htmlFor="workOvertime"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                 Làm việc ngoài giờ
                </label>
                <input
                  type="text"
                  name=""
                  id="workOvertime"
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
                  htmlFor="phone"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Số điện thoại *
                </label>
                <input
                  type="number"
                  name=""
                  id="phone"
                  className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className=" font-[500] text-black text-[14px] mb-[5px]"
                >
                  Mô tả chi tiết
                </label>
                <textarea 
                name="" 
                id="description" 
                className="w-full h-[350px] rounded-[4px] border border-[#DEDEDE] font-[500] text-black text-[14px] px-[20px] py-[14px]"
                ></textarea>
              </div>
              <div className="sm:col-span-2">
                <button className="px-[20px] h-[48px] bg-[#0088FF] rounded-[4px] font-bold text-[16px] text-white cursor-pointer">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
