import { Link } from "react-router";
import { IoMdSearch } from "react-icons/io";
import SearchBar from "./SearchBar";
import axios from "axios";
import { useEffect, useState } from "react";
import type { Location, Tag } from "../../types"; 
import { motion } from "framer-motion";

export const Section1 = () => {
    const [jobCount, setJobCount] = useState(0);
    const [location, setLocation] = useState<Location[]>([]);
    const [tags, setTags] = useState([]);
    const [companyList, setCompanyList] = useState([]);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    
    useEffect(() => {
      const init = async () => {
        try {
          const jobCountRes = await axios.get(`${BACKEND_URL}/job/count`);
          const locationRes = await axios.get(`${BACKEND_URL}/location`);
          const tagRes = await axios.get(`${BACKEND_URL}/job/tags`);
          const companyRes = await axios.get(`${BACKEND_URL}/company/list`);
          setJobCount(jobCountRes.data);
          setLocation(locationRes.data);
          setTags(tagRes.data);
          setCompanyList(companyRes.data);
        } catch (error) {
          console.error("An error occured:\n", error);
        }
      }
      init();
    }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", stiffness: 70, damping: 15 
      }
    }
  };

  return (
    <>
      <div className="relative overflow-hidden py-[80px] lg:py-[120px] bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900">
        
        {/* Abstract background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/20 blur-[120px]" />
        </div>

        <motion.div 
          className="container relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            variants={itemVariants}
            className="font-extrabold text-[32px] md:text-[44px] lg:text-[54px] text-white mb-[40px] text-center max-w-4xl mx-auto leading-tight md:tracking-tight hover:scale-[1.01] transition-transform duration-500"
          >
            Tìm kiếm công việc IT <span className="text-violet-300">mơ ước</span> của bạn.
            <div className="text-[18px] md:text-[22px] font-medium text-indigo-200 mt-4 max-w-2xl mx-auto">
              Hơn <span className="text-white font-bold">{jobCount.toLocaleString()}</span> cơ hội nghề nghiệp từ các công ty hàng đầu.
            </div>
          </motion.h1>
          
          <motion.div variants={itemVariants} className="max-w-5xl mx-auto mb-10 w-full px-4 md:px-0">
            <SearchBar 
              locations={location}
              tags={tags}
              companyList={companyList}
            />
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-x-4 flex-wrap gap-y-[15px] max-w-3xl mx-auto"
          >
            <div className="font-medium text-[16px] text-white/80">
              Mọi người đang tìm kiếm:
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {tags.slice(0, 3).map((value: Tag, index:number) => (
                <Link
                  key={index}
                  to={`/search?tags=${value.tag}`}
                  className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all duration-300 rounded-[20px] px-[20px] py-1.5 font-medium text-[15px] text-white hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                >
                  {value.tag}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};
