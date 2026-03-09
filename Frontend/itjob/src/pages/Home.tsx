import { useEffect, useState } from "react";
import { Section1 } from "../components/section/Section1";
import { Title } from "../components/title/title";
import { CardCompanyItem } from "../components/card/CardCompanyItem";
import { MarketCompanies } from "../components/section/MarketCompanies";
import { SalaryInsights } from "../components/section/SalaryInsights";
import { RecommendedJobs } from "../components/section/RecommendedJobs";
import axios from "axios";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <div className="bg-background min-h-screen text-foreground transition-colors duration-300">
      {/* Section 1 */}
      <Section1 />
      {/*End Section 1 */}

      {/* AI Job Recommendations — for logged-in users */}
      <RecommendedJobs />

      {/* AI Market Companies */}
      <MarketCompanies />

      {/* Section 2 */}
      <div className="py-[80px] relative">
        <div className="container relative z-10">
          <Title text="Nhà tuyển dụng hàng đầu" />
          {/* Wrap  */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid lg:grid-cols-3 grid-cols-2 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px] mt-8"
          >
            {/* Item  */}
            {companyList.slice((page - 1) * 6, page * 6).map(companyInfo => (
              <motion.div key={companyInfo["id"]} variants={itemVariants}>
                <CardCompanyItem companyInfo={companyInfo} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-[40px] flex justify-center">
            <select
              onChange={e => setPage(Number(e.target.value))}
              name=""
              id=""
              className="glass-panel border border-black/10 dark:border-white/10 rounded-xl py-[12px] px-[20px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-md focus:ring-2 focus:ring-primary shadow-sm cursor-pointer outline-none transition-all hover:bg-white dark:hover:bg-slate-800"
            >
              {
                Array(Math.ceil(companyList.length / 6)).fill(0).map((_, index) => (
                  <option key={index} value={index + 1} className="dark:bg-slate-800 dark:text-white">
                    {`Trang ${index + 1}`}
                  </option>
                ))
              }
            </select>
          </div>
        </div>
      </div>
      {/*End Section 2 */}

      {/* AI Salary Insights */}
      <SalaryInsights />
    </div>
  )
}
