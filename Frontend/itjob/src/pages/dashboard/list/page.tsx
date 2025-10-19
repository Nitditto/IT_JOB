import {Link} from "react-router";
import { FaUserTie } from "react-icons/fa6";
import { useEffect } from "react";
import { Title } from "../../../components/title/title";
import { CardCompanyItem } from "../../../components/card/CardCompanyItem";
import { Pagination } from "../../../components/pagination/Pagination";

export default function CompanyListPage() {
  useEffect(()=>{
    document.title="Danh sách công ty";
  },[])
  const companyList = [
    {
      logoURL: "/assets/images/demo-company-1.png",
      title: "LG Electronics Development Vietnam (LGEDV)",
      location: "Ho Chi Minh",
      jobCount: 5,
      link: "/companies/lg-electronics",
    },
    {
      logoURL: "/assets/images/demo-company-2.png",
      title: "MB Bank",
      location: "Ha Noi",
      jobCount: 15,
      link: "/companies/mb-bank",
    },
    {
      logoURL: "/assets/images/demo-company-3.png",
      title: "FPT Software",
      location: "Da Nang",
      jobCount: 20,
      link: "/companies/fpt-software",
    },
  ];
  return (
    <>
          <Title text="Danh sách công ty" />
          {/* Wrap  */}
          <div className="grid lg:grid-cols-3 grid-cols-2 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
            {/* Item  */}
            {companyList.map((item, index) => (
              <Link
                key={index}
                to={"#"}
                className="rounded-[8px] border-[1px] border-[#DEDEDE] relative"
                style={{
                  background:
                    "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)",
                }}
              >
                <img
                  src="/assets/images/card-bg.svg"
                  alt=""
                  className="absolute top-0 left-0 w-full h-auto"
                />
                <div className="relative">
                  <div
                    className="sm:w-[160px] aspect-square w-[125px] sm:mt-[32px] mt-[20px] sm:mb-[24px] mb-[16px] mx-auto rounded-[8px] bg-white"
                    style={{
                      boxShadow: "0px 4px 24px 0px #0000001F",
                    }}
                  >
                    <img
                      src={item.logoURL}
                      alt={item.title}
                      className="w-full h-full object-contain p-[10px]"
                    />
                  </div>
                  <h3 className="font-bold sm:text-[18px] text-[14px] text-[#121212] sm:mb-[24px] mb-[16px] mx-[16px] text-center line-clamp-2">
                    {item.title}{" "}
                  </h3>
                  <div className="bg-[#F7F7F7] py-[12px] px-[16px] flex items-center sm:justify-between justify-center flex-wrap gap-[12px]">
                    <div className="font-[400] text-[14px] text-[#414042]">
                      {item.location}
                    </div>
                    <div className="inline-flex items-center gap-[6px] font-[400] text-[14px] text-[#121212]">
                      <FaUserTie className="text-[16px] text-[#000096]" />{" "}
                      {item.jobCount} Việc làm
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <CardCompanyItem />
          </div>
          <Pagination/>
    </>
  );
}
