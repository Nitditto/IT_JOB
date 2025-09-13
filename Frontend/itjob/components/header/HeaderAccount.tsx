import Link from "next/link";

export const HeaderAccount = () => {
  return (
    <>
      <div className="font-[600] sm:text-[16px] text-[12px] text-white inline-flex gap-x-[5px] relative  group/sub-1">
        {/* Chua Dang nhap */}
        {/* <Link href="#" className="">
          Đăng Nhập
        </Link>
        <span className="">/</span>
        <Link href="#" className="">
          Đăng Ký
        </Link> */}
        {/* Da Dang nhap  */}
        <Link href={"#"} className="">
          LG Elect...
        </Link>
        <ul className="hidden bg-[#000065] lg:absolute relative lg:top-[100%] top-0 right-0 lg:w-[200px] w-full rounded-[4px] group-hover/sub-1:block">
          <li className="flex items-center flex-wrap justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096] group/sub-2">
            <Link
              href={"#"}
              className="font-[600] text-[16px] text-white"
            >
              Thông tin công ty
            </Link>
          </li>
          <li className="flex items-center flex-wrap justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096] group/sub-2">
            <Link
              href={"#"}
              className="font-[600] text-[16px] text-white"
            >
              Quản lý công việc
            </Link>
          </li>
          <li className="flex items-center flex-wrap justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096] group/sub-2">
            <Link
              href={"#"}
              className="font-[600] text-[16px] text-white"
            >
              Quản lý CV
            </Link>
          </li>
          <li className="flex items-center flex-wrap justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096] group/sub-2">
            <Link
              href={"#"}
              className="font-[600] text-[16px] text-white"
            >
              Đăng xuất
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};
