import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Section1 } from "../components/section/Section1";
import { Title } from "../components/title/title";
import { FaUserTie } from "react-icons/fa";
import { CardCompanyItem } from "../components/card/CardCompanyItem";
import axios from "axios";
import type { HomePageData } from "../types";

export default function SearchHome() {
  
  const [companyList, setCompanyList] = useState([]);
  const [page, setPage] = useState(1);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const init = async () => {
      const companyRes = await axios.get(`${BACKEND_URL}/company/list`)
      setCompanyList(companyRes.data)
    }

    init()
  }, [])


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
            {companyList.slice((page-1)*6, page*6).map(companyInfo => (
              <CardCompanyItem companyInfo={companyInfo} key={companyInfo["id"]} />
            ))}
          </div>
                <div className="mt-[30px]">
        <select onChange={e=>setPage(e.target.value)} name="" id="" className="border border-[#DEDEDE] rounded-[8px] py-[12px] px-[18px]">
          {
            Array(Math.ceil(companyList.length/6)).fill(0).map((_, index) => (
              <option value={index+1}>{`Trang ${index+1}`}</option>
            ))
          }
        </select>
      </div>
        </div>
      </div>
      {/*End Section 2 */}
    </div>
  )
}
