//Frontend\itjob\src\pages\company\cv\list\page.tsx
import { Link, useParams, useSearchParams } from 'react-router'
import {
    FaBriefcase,
    FaCircleCheck,
    FaEnvelope,
    FaEye,
    FaGlobe,
    FaPhone,
    FaUserTie,
} from 'react-icons/fa6'
import { useEffect, useState } from 'react'
import axios from 'axios';
import translation from '@/utils/translation';
import api from '@/utils/api';
import { Pagination } from '@/components/pagination/Pagination';

interface CVData {
    accountID: number;
    jobID: number;
    name: string; 
    phone: string;
    email: string;
    cvFile: string;
    referral: string;
    status: "PENDING" | "APPROVED" | "REJECTED";

}

interface JobData {
    name: string;
    minSalary: number;
    maxSalary: number;
    position: string;
    workstyle: string;
    tags: string[];
    location: { name: string };
    // address: string;
    // company: { name: string };
}

export default function CompanyManageCVListPage() {
    const { id } = useParams();
    const { searchParams, setSearchParams } = useSearchParams();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const [page, setPage] = useState(1);
    const [cvList, setCvList] = useState<CVData[]>([]);
    const [jobInfo, setJobInfo] = useState<JobData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        document.title = 'Quản lý CV';
        const fetchData = async () => {
            if (!id) return;
            try {
                // Lấy thông tin Job
                const jobRes = await axios.get(`${BACKEND_URL}/job/get/${id}`);
                setJobInfo(jobRes.data);

                // Lấy danh sách CV (Cần Token)
                const cvRes = await api.get(`/cv/${id}/list`);
                setCvList(cvRes.data);
                setPage(parseInt(searchParams.get("page") ?? "1"));
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id, BACKEND_URL]);

    const handleQuickUpdate = async (cv: CVData, newStatus: "APPROVED" | "REJECTED") => {
        if (!confirm(`Bạn muốn ${newStatus === 'APPROVED' ? 'NHẬN' : 'TỪ CHỐI'} hồ sơ của ${cv.name}?`)) return;

        try {
            await api.put(
                `/cv/company/status/${cv.jobID}/${cv.accountID}`,
                null,
                { params: { status: newStatus } }
            );
            
            setCvList(prevList => 
                prevList.map(item => 
                    (item.accountID === cv.accountID && item.jobID === cv.jobID)
                    ? { ...item, status: newStatus }
                    : item
                )
            );
        } catch (error) {
            alert("Lỗi cập nhật trạng thái.");
        }
    }

    const renderStatus = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <div className="mt-2 flex items-center justify-center gap-2 text-[14px] font-medium text-[#47BE02]"><FaCircleCheck /> Đã nhận</div>;
            case "REJECTED":
                return <div className="mt-2 flex items-center justify-center gap-2 text-[14px] font-medium text-[#FF0000]"><FaCircleCheck /> Đã từ chối</div>;
            default:
                return <div className="mt-2 flex items-center justify-center gap-2 text-[14px] font-medium text-gray-500"><FaEye /> Chưa Duyệt</div>;
        }
    }
    if (isLoading) return <div className="text-center py-20">Đang tải danh sách...</div>;
    if (!jobInfo) return <div className="text-center py-20">Không tìm thấy công việc.</div>;
    return (
        <>
            <div className="mx-8 w-[90%] py-[60px]">
                <div className="mb-[20px] flex flex-wrap flex-col  justify-between gap-[20px]">
                    <h1 className="text-[28px] font-bold text-[#121212]">
                        Quản lý CV
                    </h1>
                    <div className="rounded-[8px] border border-[#DEDEDE] p-[20px] bg-white shadow-sm">
                        <h2 className="mb-4 text-[20px] font-bold border-b pb-2">Thông tin tuyển dụng</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[15px]">
                            <div className="font-bold text-lg text-blue-600 col-span-2">{jobInfo.name}</div>
                            <div className="flex items-center gap-2"><FaUserTie/> {translation[jobInfo["position"]]}</div>
                            <div className="flex items-center gap-2"><FaBriefcase/> {translation[jobInfo["workstyle"]]}</div>
                            <div className="flex items-center gap-2"><span className="font-semibold">Lương:</span> {jobInfo.minSalary.toLocaleString()}$ - {jobInfo.maxSalary.toLocaleString()}$</div>
                            <div className="flex items-center gap-2"><FaGlobe/> {jobInfo.location?.name}</div>
                            <div className="col-span-2 mt-2">
                                <span className="font-semibold">Công nghệ: </span> 
                                {/* {jobInfo.tags.map(tag => <span key={tag} className="bg-gray-100 px-2 py-1 rounded text-xs mr-1">{tag}</span>)} */}
                                {jobInfo.tags.join(', ')}
                            </div>
                            <Link
                                to={`/job/${id}`}
                                className="text-[14px] font-[400] text-[#0088FF] underline mt-2"
                            >
                                Xem bài đăng tuyển dụng
                            </Link>
                        </div>
                    </div>
                </div>

                {cvList.length === 0 ? (
                <div className="text-center text-gray-500 py-10 italic bg-gray-50 rounded border">
                    Chưa có ứng viên nào nộp hồ sơ cho vị trí này.
                </div>
            ) : (
                <>
                <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-3">
                    {cvList.slice((page-1)*6, page*6).map((cv, index) => (
                        <div key={index} className="relative flex flex-col rounded-[8px] border border-[#DEDEDE] bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
                            {/* Màu trạng thái */}
                            <div className={`h-2 w-full ${
                                cv.status === 'APPROVED' ? 'bg-green-500' : 
                                cv.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>

                            <div className="p-5 flex flex-col h-full">
                                <h3 className="text-center text-[18px] font-[700] text-[#121212] mb-2 truncate" title={cv.name}>
                                    {cv.name}
                                </h3>
                                
                                <div className="text-center space-y-1 mb-4">
                                    <div className="flex items-center justify-center gap-2 text-[14px] text-gray-600">
                                        <FaEnvelope className="text-gray-400" /> <span className="truncate max-w-[200px]">{cv.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[14px] text-gray-600">
                                        <FaPhone className="text-gray-400" /> {cv.phone}
                                    </div>
                                </div>

                                {renderStatus(cv.status)}

                                <div className="mt-auto pt-6 flex flex-wrap items-center justify-center gap-3">
                                    <Link
                                        to={`./${cv["accountID"]}`}
                                        className="rounded-[4px] bg-[#0088FF] px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-600 transition-colors"
                                    >
                                        Xem chi tiết
                                    </Link>
                                    
                                    {/* Nút nhanh (chỉ hiện khi PENDING) */}
                                    {cv.status === 'PENDING' && (
                                        <>
                                            <button 
                                                onClick={() => handleQuickUpdate(cv, 'APPROVED')}
                                                className="rounded-[4px] bg-[#9FDB7C] px-4 py-2 text-[14px] font-medium text-black hover:bg-green-400 transition-colors"
                                            >
                                                Nhận
                                            </button>
                                            <button 
                                                onClick={() => handleQuickUpdate(cv, 'REJECTED')}
                                                className="rounded-[4px] bg-[#FF5100] px-4 py-2 text-[14px] font-medium text-white hover:bg-orange-600 transition-colors"
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Pagination list={cvList} page={page} setPage={setPage} searchParams={searchParams} setSearchParams={setSearchParams} />
                </>
            )}
            </div>
        </>
    )
}
