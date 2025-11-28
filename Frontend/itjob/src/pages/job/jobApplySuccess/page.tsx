import { Link, useParams } from 'react-router';
import { CheckCircle2 } from 'lucide-react'; // (Hoặc dùng ảnh của bạn)
import { useEffect, useState } from 'react';
import axios from 'axios';

// Bạn có thể tạo các component Card công việc nhỏ này
const SimilarJobCard = ({ link, title, company, logo }: any) => (
  <div className="flex items-center gap-3">
    <img src={logo} alt={company} className="w-12 h-12 rounded-md border" />
    <div>
      <Link to={link} className="font-semibold text-gray-800 hover:text-red-600 cursor-pointer">{title}</Link>
      <p className="text-sm text-gray-600">{company}</p>
    </div>
  </div>
);



export default function JobApplySuccess() {
  const { id } = useParams();
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const [jobData, setJobData] = useState({
  name: "",
  companyName: "",
  location: {
    abbreviation: "",
    name: ""
  }
});
const [similarJobs, setSimilarJobs] = useState([]);
  useEffect(() => {
  const init = async () => {
    const jobRes = await axios.get(`${BACKEND_URL}/job/get/${id}`);
    const companyRes = await axios.get(`${BACKEND_URL}/company/${jobRes.data["companyID"]}`)
    setJobData({...jobRes.data, companyName: companyRes.data["name"]});

    const similarRes = await axios.get(`${BACKEND_URL}/job/search`, {
      params: {location: jobRes.data["location"]["abbreviation"]}
    })
    setSimilarJobs(similarRes.data);
  }

  init()
}, [])
  return (
    // Background cong (giống trang apply)
    <div className="min-h-screen bg-gray-100 py-12 px-4 bg-linear-to-bl from-gray-400 via-purple-300 to-blue-500"
        
    >
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-8 text-center">
        
        {/* Bạn có thể thay icon này bằng ảnh robot của bạn */}
        <CheckCircle2 size={60} className="mx-auto text-green-500" />
        {/* <img src="/path/to/robot.png" alt="Success" className="mx-auto h-20 w-20" /> */}

        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Tuyệt vời! Chúng tôi đã nhận được CV của bạn
        </h1>

        <div className="text-left text-gray-600 mt-6 border-b pb-6">
          <p>Chúng tôi đã nhận được CV cho</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Công việc: </strong>{jobData["name"]}</li>
            <li><strong>Công ty: </strong>{jobData["companyName"]}</li>
          </ul>
          <p className="mt-4 text-sm">
            CV của bạn sẽ được gửi đến nhà tuyển dụng sau khi qua review của chúng tôi<br/>
            Vui lòng kiếm tra email của bạn để được cập nhật tình trạng của CV
          </p>
        </div>

        <div className="text-left mt-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Có hứng thú với việc làm tại {jobData["location"]["name"]}?
          </h3>
          {/* Grid các công việc tương tự */}
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {similarJobs.filter(e=>e["id"]!=id).slice(0,4).map((data, index) => (
<SimilarJobCard key={index} link={`/job/${data["id"]}`} title={data["name"]} company={data["companyName"]} logo={data["companyAvatar"]} />
            ))}

          </div>

          {/* Nút "Search for other similar jobs" sẽ link về trang chủ */}
          <div className="mt-8 text-center">
            <Link 
              to="/search" 
              className="px-6 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
            >
              Tìm các việc làm tương tự
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}