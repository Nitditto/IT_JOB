//Frontend\itjob\src\pages\company\cv\detail\page.tsx
import {Link, useNavigate, useParams} from "react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";
import { Check, DownloadCloud, Eye, FileText, Phone, User, X } from "lucide-react";

interface CVDetail {
  name: string;
  phone: string;
  cvFile: string; // Base64 string
  referral: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
export default function CompanyManageCVDetailPage(){
  const { jobId, accountId } = useParams(); 
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  const [cvData, setCvData] = useState<CVDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchCV = async () => {
      try {
        const res = await api.get(`/cv/company/detail/${jobId}/${accountId}`);
        setCvData(res.data);
        document.title = `CV - ${res.data.name}`;
      } catch (error) {
        console.error("Lỗi tải CV:", error);
        alert("Không tìm thấy CV hoặc bạn không có quyền truy cập.");
        navigate(-1);
      }
    };
    if (jobId && accountId) fetchCV();
  }, [jobId, accountId, BACKEND_URL, navigate]);
  const handleOpenFile = () => {
      if (!cvData?.cvFile) return;
      
      // Mở Base64 PDF trong tab mới
      const pdfWindow = window.open("");
      if (pdfWindow) {
          pdfWindow.document.write(
              `<iframe width='100%' height='100%' src='${cvData.cvFile}'></iframe>`
          );
          pdfWindow.document.title = `CV - ${cvData.name}`;
      }
  };

  const handleUpdateStatus = async (newStatus: "APPROVED" | "REJECTED") => {
    const actionName = newStatus === "APPROVED" ? "DUYỆT" : "TỪ CHỐI";
    if (!confirm(`Bạn chắc chắn muốn ${actionName} hồ sơ này?`)) return;
    
    setIsLoading(true);
    try {
        await api.put(
            `/cv/company/status/${jobId}/${accountId}`, 
            null, 
            { params: { status: newStatus } } 
        );
        
        // Cập nhật UI local
        setCvData(prev => prev ? { ...prev, status: newStatus } : null);
        alert(`Đã ${actionName} hồ sơ thành công!`);

    } catch (error) {
        console.error(error);
        alert("Lỗi khi cập nhật trạng thái.");
    } finally {
        setIsLoading(false);
    }
  };
  if (!cvData) return <div className="p-20 text-center">Đang tải dữ liệu...</div>;

  const renderStatusLabel = () => {
    switch(cvData.status) {
        case "APPROVED": return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm border border-green-200">Đã Duyệt</span>;
        case "REJECTED": return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm border border-red-200">Đã Từ Chối</span>;
        default: return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-bold text-sm border border-gray-200">Chưa Xem</span>;
    }
  };

  return (
    <div className="py-[40px] bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
                <Link to={`/dashboard/company/job/${jobId}/view`} className="text-sm text-gray-500 hover:text-[#0088FF] hover:underline mb-1 block">
                    &larr; Quay lại danh sách CV
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Chi tiết hồ sơ ứng viên</h1>
            </div>
            <div>{renderStatusLabel()}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-[#DEDEDE] shadow-sm">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
                            <User size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{cvData.name}</h2>
                        {/* <p className="text-sm text-gray-500">Ứng tuyển: {cvData.job?.name || "Developer"}</p> */}
                    </div>
                    
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Phone size={18} className="text-gray-400" />
                            <span>{cvData.phone}</span>
                        </div>
                        {/* Nếu có email */}
                        {/* {cvData.account?.email && (
                            <div className="flex items-center gap-3 text-gray-700 truncate" title={cvData.account.email}>
                                <span className="text-gray-400">@</span>
                                <span>{cvData.account.email}</span>
                            </div>
                        )} */}
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="bg-white p-6 rounded-lg border border-[#DEDEDE] shadow-sm space-y-3">
                    <h3 className="font-semibold text-gray-700 mb-2">Hành động</h3>
                    
                    <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={isLoading || cvData.status === 'APPROVED'}
                        onClick={() => handleUpdateStatus('APPROVED')}
                    >
                        <Check className="mr-2 h-4 w-4" /> Duyệt Hồ Sơ
                    </Button>

                    <Button 
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={isLoading || cvData.status === 'REJECTED'}
                        onClick={() => handleUpdateStatus('REJECTED')}
                    >
                        <X className="mr-2 h-4 w-4" /> Từ Chối Hồ Sơ
                    </Button>
                </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT CV & FILE */}
            <div className="md:col-span-2 space-y-6">
                
                {/* Phần Thư giới thiệu */}
                <div className="bg-white p-6 rounded-lg border border-[#DEDEDE] shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center justify-between">
                        <span>Thư giới thiệu</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">PDF Document</span>
                    </h3>
                    
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <FileText size={48} className="text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium mb-4">referral.pdf</p>
                        
                        <div className="flex gap-3">
                            {/* NÚT MỞ FILE (THAY IFRAME) */}
                            <Button onClick={handleOpenFile} className="bg-[#0088FF] hover:bg-blue-700 text-white">
                                <Eye className="mr-2 h-4 w-4" /> Xem thư giới thiệu
                            </Button>
                            
                            {/* Nút Tải xuống (Nếu muốn) */}
                            <a href={cvData.referral} download={`referral.pdf`}>
                                <Button variant="outline" className="border-gray-300">
                                    <DownloadCloud className="mr-2 h-4 w-4" /> Tải xuống
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Phần File CV */}
                <div className="bg-white p-6 rounded-lg border border-[#DEDEDE] shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center justify-between">
                        <span>File CV đính kèm</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">PDF Document</span>
                    </h3>
                    
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <FileText size={48} className="text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium mb-4">CV_{cvData.name.replace(/\s+/g, '_')}.pdf</p>
                        
                        <div className="flex gap-3">
                            {/* NÚT MỞ FILE (THAY IFRAME) */}
                            <Button onClick={handleOpenFile} className="bg-[#0088FF] hover:bg-blue-700 text-white">
                                <Eye className="mr-2 h-4 w-4" /> Xem File CV
                            </Button>
                            
                            {/* Nút Tải xuống (Nếu muốn) */}
                            <a href={cvData.cvFile} download={`CV_${cvData.name}.pdf`}>
                                <Button variant="outline" className="border-gray-300">
                                    <DownloadCloud className="mr-2 h-4 w-4" /> Tải xuống
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}