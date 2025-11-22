import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { ChevronLeft, UploadCloud } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router';

interface FormErrors {
  cvFile?: string;
  fullName?: string;
  phone?: string;
  location?: string;
}
const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    coverLetter: '',
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
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
    if (!cvFile) newErrors.cvFile = "Vui lòng tải lên CV của bạn.";
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên.";
    if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại.";
    // (Thêm validate cho SĐT nếu cần)
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return; 
    
    setIsLoading(true);

    // Tạo FormData để gửi file
    const submissionData = new FormData();
    submissionData.append('jobId', jobId as string);
    submissionData.append('fullName', formData.fullName);
    submissionData.append('phone', formData.phone);
    submissionData.append('location', formData.location);
    submissionData.append('coverLetter', formData.coverLetter);
    submissionData.append('cv', cvFile as File); 

    try {
     // MỞ LẠI LỆNH GỌI API THẬT (BỎ setTimeout)
      // Vì đã bảo vệ backend, lệnh này sẽ thành công nếu có token
      // và thất bại (vào catch) nếu không có token
      await api.post(`/cv/${jobId}/apply`, submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/apply/success');
    } catch (error) {
      console.error("Lỗi khi nộp CV:", error);
      alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4" 
         style={{ background: "linear-gradient(to bottom right, #1a0000 50%, #f3f4f6 50%)" }}
    >
      <div className="max-w-3xl mx-auto">
        
        <Link to={`/job/${jobId}`} className="inline-flex items-center text-white hover:text-gray-300 mb-4">
          <ChevronLeft size={20} /> Quay lại
        </Link>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Front End Developer ( Javascript, ReactJS)
          </h1>

          {/* CV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CV ứng tuyển *</label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 
                 ${errors.cvFile ? 'border-red-500' : 'border-gray-300'} 
                 border-dashed rounded-md bg-red-50`}
            >
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label 
                    htmlFor="file-upload" 
                    className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none"
                  >
                    <span>Chọn file</span>
                    <input id="file-upload" name="cvFile" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                  </label>
                  <p className="pl-1">để tải lên</p>
                </div>
                {/* Hiển thị tên file hoặc thông báo */}
                {cvFile ? (
                  <p className="text-sm text-green-600 font-semibold">{cvFile.name}</p>
                ) : (
                  <p className="text-xs text-gray-500">DOC, DOCX, PDF. Tối đa 5MB</p>
                )}
              </div>
            </div>
            {errors.cvFile && <p className="text-red-600 text-sm mt-1">{errors.cvFile}</p>}
          </div>

          <h2 className="text-lg font-semibold text-gray-800 border-t pt-4">Thông tin cơ bản</h2>

          {/* Họ và tên */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên *</label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md h-11 px-3 border 
                 ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* Số điện thoại */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại *</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md h-11 px-3 border 
                 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>
          
          {/* Nơi làm việc */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Nơi làm việc mong muốn *</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm rounded-md h-11 px-3 border border-gray-300"
            >
              <option value="">Chọn nơi làm việc</option>
              <option value="ho-chi-minh">Hồ Chí Minh</option>
              <option value="ha-noi">Hà Nội</option>
              <option value="da-nang">Đà Nẵng</option>
              <option value="remote">Làm từ xa (Remote)</option>
            </select>
          </div>

          {/* Thư xin việc */}
          <div>
            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
              Thư xin việc (Không bắt buộc)
            </label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              rows={6}
              value={formData.coverLetter}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm rounded-md p-3 border border-gray-300"
              placeholder="Nếu nhiều vị trí cụ thể, để làm hồ sơ ứng tuyển của bạn thuyết phục hơn..."
            />
            <p className="text-xs text-gray-500 mt-1">Còn lại {500 - formData.coverLetter.length} trong tổng số 500 ký tự</p>
          </div>
          
          {/* Nút Submit */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
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