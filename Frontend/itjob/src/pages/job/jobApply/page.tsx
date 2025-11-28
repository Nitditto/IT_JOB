import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { ChevronLeft, Eye, FileText, UploadCloud, X } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router';
import { useFilePicker } from 'use-file-picker';

interface FormErrors {
  cvFile?: string;
  name?: string;
  phone?: string;
  email?: string;
}
const JobApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: user ? user.name : "",
    phone: user && user.phone != null ? user.phone : "",
    email: user ? user.email : "",
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { 
    openFilePicker: openCVPicker, 
    filesContent: cvFiles, 
    loading: cvLoading, 
    clear: clearCV 
  } = useFilePicker({
    readAs: 'DataURL',
    accept: '.pdf',
    multiple: false,
  });

  const { 
    openFilePicker: openRefPicker, 
    filesContent: refFiles, 
    loading: refLoading, 
    clear: clearRef 
  } = useFilePicker({
    readAs: 'DataURL',
    accept: '.pdf', // Có thể thêm .png, .jpg nếu muốn
    multiple: false,
  });

  useEffect(() => {
    // Nếu chưa kiểm tra xong, không làm gì cả
    if (isAuthLoading) {
      return; 
    }
    
    // Nếu kiểm tra xong và KHÔNG đăng nhập
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để nộp CV.");
      navigate('/login'); // Chuyển về trang login
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB
         setErrors(prev => ({ ...prev, cvFile: "File không được vượt quá 5MB." }));
         setCvFile(null);
      } else {
         setCvFile(file);
         setErrors(prev => ({ ...prev, cvFile: undefined })); // Xóa lỗi nếu file hợp lệ
      }
    }
  };
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Kiểm tra file từ hook
    if (cvFiles.length === 0) {
        newErrors.cvFile = "Vui lòng tải lên CV của bạn.";
    }
    
    if (!formData.name.trim()) newErrors.name = "Vui lòng nhập họ và tên.";
    if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại.";
    if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return; 
    
    setIsLoading(true);

    try {
      const cvContent = cvFiles[0]?.content;
      const referralContent = refFiles.length > 0 ? refFiles[0].content : null; // Referral là tùy chọn

      const payload = {
          jobID: id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          cvFile: cvContent,     // Base64 của CV
          referral: referralContent // Base64 của Referral (hoặc null)
      };

     // MỞ LẠI LỆNH GỌI API THẬT (BỎ setTimeout)
      // Vì đã bảo vệ backend, lệnh này sẽ thành công nếu có token
      // và thất bại (vào catch) nếu không có token
      await api.post(`/cv/${id}/apply`, payload);
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('./success');
    } catch (error: any) {
      console.error("Lỗi khi nộp CV:", error);
      const message = error.response?.data || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      alert(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setIsLoading(false);
    }
  };
  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center">Đang kiểm tra...</div>;
  }
  const FilePreview = ({ file, onClear, label }: { file: any, onClear: () => void, label: string }) => (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="text-blue-600 w-6 h-6 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{label}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <a 
                href={file.content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                title="Xem trước file"
            >
                <Eye size={18} />
            </a>
            <button 
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title="Xóa file"
            >
                <X size={18} />
            </button>
        </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4" 
         style={{ background: "linear-gradient(to bottom right, #1a0000 50%, #f3f4f6 50%)" }}
    >
      <div className="max-w-3xl mx-auto">
        <Link to={`/job/${id}`} className="inline-flex items-center text-white hover:text-gray-300 mb-4">
          <ChevronLeft size={20} /> Quay lại
        </Link>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Ứng tuyển công việc
          </h1>

          {/* --- 1. KHỐI UPLOAD CV --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CV ứng tuyển *</label>
            
            {/* Nếu CHƯA có file thì hiện vùng drop */}
            {cvFiles.length === 0 && (
                <div 
                    onClick={() => openCVPicker()}
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md 
                        ${errors.cvFile ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                        cursor-pointer transition-colors relative`}
                >
                    <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="text-sm text-gray-600">
                        <span className="font-medium text-red-600 hover:text-red-500">
                            {cvLoading ? "Đang tải..." : "Tải lên CV"}
                        </span>
                        <p className="pl-1">hoặc kéo thả vào đây</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF(Max 5MB)</p>
                    </div>
                </div>
            )}

            {/* Nếu ĐÃ có file thì hiện Preview */}
            {cvFiles.length > 0 && (
                <FilePreview file={cvFiles[0]} onClear={clearCV} label="Hồ sơ chính" />
            )}

            {errors.cvFile && <p className="text-red-600 text-sm mt-1">{errors.cvFile}</p>}
          </div>

          <h2 className="text-lg font-semibold text-gray-800 border-t pt-4">Thông tin cơ bản</h2>

          <div>
            <label className="required block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text" name="name"
              value={formData.name} onChange={handleChange}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md h-11 px-3 border 
                 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="required block text-sm font-medium text-gray-700">Email</label>
            <input
              type="text" name="email"
              value={formData.email} onChange={handleChange}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md h-11 px-3 border 
                 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="required block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input
              type="tel" name="phone"
              value={formData.phone} onChange={handleChange}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md h-11 px-3 border 
                 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* --- 2. KHỐI UPLOAD REFERRAL (THAY THẾ TEXTAREA) --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thư giới thiệu / Cover Letter (Không bắt buộc)</label>
            
            {refFiles.length === 0 && (
                <div 
                    onClick={() => openRefPicker()}
                    className="mt-1 flex justify-center px-6 pt-4 pb-4 border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 rounded-md cursor-pointer transition-colors"
                >
                    <div className="space-y-1 text-center">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600 hover:text-blue-500">
                                {refLoading ? "Đang tải..." : "Tải lên Thư giới thiệu"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">PDF</p>
                    </div>
                </div>
            )}

            {refFiles.length > 0 && (
                <FilePreview file={refFiles[0]} onClear={clearRef} label="Thư giới thiệu" />
            )}
          </div>
          
          <div className="pt-4">
            <button
              type="submit" disabled={isLoading}
              className="cursor-pointer w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi CV của tôi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobApplication