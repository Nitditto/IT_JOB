
import { Link } from "react-router";
import { IoMdSearch } from "react-icons/io";

export const Section1 = () => {
  return (
    <>
      <div className="bg-[#000065] py-[60px]">
        <div className="container">
          <h1 className="font-bold text-[28px] text-white mb-[30px] text-center">
            887 Việc làm IT cho Developer &quot;Chất&quot;
          </h1>
          <form
            action=""
            className="flex gap-x-[15px] gap-y-[12px] mb-[30px] md:flex-nowrap flex-wrap"
          >
            <select
              name=""
              id=""
              className="md:w-[240px] w-full h-[56px] rounded-[4px] bg-white font-[500] text-[16px] text-[#121212] px-[20px]"
            >
              <option value="">Tất cả thành phố</option>
              <option value="">Hà Nội</option>
              <option value="">Đà Nẵng</option>
              <option value="">Hồ Chí Minh</option>
            </select>
            <input
              type="text"
              className="md:flex-1 w-full h-[56px] rounded-[4px] bg-white font-[500] text-[16px] text-[#121212] px-[20px]"
              placeholder="Nhập từ khóa..."
            />
            <button className="flex items-center justify-center gap-x-[10px] md:w-[240px] w-full h-[56px] rounded-[4px] bg-[#0088FF] font-[500] text-[16px] text-[#fff] px-[20px] cursor-pointer">
              <IoMdSearch className="text-[26px]" /> Tìm kiếm
            </button>
          </form>
          <div className="flex items-center gap-x-[12px] flex-wrap gap-y-[15px]">
            <div className="font-[500] text-[16px] text-[#DEDEDE]">
              Mọi người đang tìm kiếm:
            </div>
            <div className="flex gap-[10px] flex-wrap">
              <Link
                to={"#"}
                className="border-[1px] border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] px-[22px] py-[8px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white"
              >
                ReactJS
              </Link>
              <Link
                to={"#"}
                className="border-[1px] border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] px-[22px] py-[8px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white"
              >
                Javascript
              </Link>
              <Link
                to={"#"}
                className="border-[1px] border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] px-[22px] py-[8px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white"
              >
                NodeJS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
