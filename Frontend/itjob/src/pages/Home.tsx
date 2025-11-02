import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Section1 } from "../components/section/Section1";
import { Title } from "../components/title/title";
import { FaUserTie } from "react-icons/fa";
import { CardCompanyItem } from "../components/card/CardCompanyItem";
import axios from "axios";
import type { HomePageData } from "../types";

export default function SearchHome() {
  
   const companyList=[
    {
      id: 1,
      logoURL:"/assets/images/demo-company-1.png",
      title:"LG Electronics Development Vietnam (LGEDV)",
      location:"Ho Chi Minh",
      jobCount:5,
      link:"/companies/lg-electronics",
    },
    {
      id: 2,
      logoURL:"/assets/images/demo-company-2.png",
      title:"MB Bank",
      location: "Ha Noi",
      jobCount:15,
      link:"/companies/mb-bank"
    },
    {
      id: 3,
      logoURL:"/assets/images/demo-company-3.png",
      title: "FPT Software",
      location:"Da Nang",
      jobCount:20,
      link:"/companies/fpt-software"
    },
    {
      id: 4,
      logoURL:"/assets/images/demo-company-1.png",
      title:"LG Electronics Development Campuchia (LGEDC)",
      location:"Campuchia",
      jobCount:25,
      link:"/companies/lg-electronics",
    },
    {
      id: 5,
      logoURL:"/assets/images/demo-company-2.png",
      title:"MM Bank",
      location: "Ha Noi",
      jobCount:30,
      link:"/companies/mb-bank"
    },
    {
      id: 6,
      logoURL:"/assets/images/demo-company-3.png",
      title: "FPT Softcore",
      location:"Da Nang",
      jobCount:35,
      link:"/companies/fpt-software"
    }
  ]

  return (
    <div>
      {/* Section 1 */}
        <Section1 />
      {/*End Section 1 */}

      {/* Section 2 */}
      <div className="py-[60px] ">
        <div className="container">
          <Title text="Nhà tuyển dụng hàng đầu"/>
          {/* Wrap  */}
          <div className="grid lg:grid-cols-3 grid-cols-2 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
            {/* Item  */}
            {companyList.map(companyInfo => (
              <CardCompanyItem companyInfo={companyInfo} key={companyInfo.id} />
            ))}
          </div>
        </div>
      </div>
      {/*End Section 2 */}
    </div>
  )
}
