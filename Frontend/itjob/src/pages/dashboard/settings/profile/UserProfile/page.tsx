import { useEffect, useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import api from "../../../../../utils/api";
import axios from "axios";
import { useFilePicker } from 'use-file-picker';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router"; 

// 1. SỬA LỖI TYPE: Đổi tên Location thành JobLocation
import type { Location as JobLocation } from "@/types";
import { FaPen, FaUser } from "react-icons/fa6";

const USER_STATUS = [
    { value: "employed", label: "Đã có việc làm" },
    { value: "freelancer", label: "Làm tự do" },
    { value: "inactive", label: "Đang tìm việc" }
];
export default function UserManageProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [locations, setLocations] = useState<JobLocation[]>([]);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ message: "", isError: false });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    address: "",
    location: "", 
    description: "",
    lookingfor: "", 
    status: "inactive"
  });

  const { openFilePicker, filesContent, loading: fileLoading } = useFilePicker({
    readAs: 'DataURL',
    accept: 'image/*',
    multiple: false,
  });

  useEffect(() => {
    const init = async () => {
      try {
        // 3. SỬA API CALL: Dùng JobLocation
        const locRes = await axios.get<JobLocation[]>(`${BACKEND_URL}/location`);
        setLocations(locRes.data);

        if (user?.id) {
          const res = await api.get(`/user/${user.id}`);
          const info = res.data;

          setFormData({
            name: info.name || "",
            email: info.email || "",
            phone: info.phone || "",
            avatar: info.avatar || "",
            address: info.address || "",
            // Lấy mã vùng từ object location
            location: info.location?.abbreviation || "", 
            description: info.description || "",
            lookingfor: info.lookingfor || "",
            status: info.status || "inactive"
          });
        }
        document.title = "Chỉnh sửa thông tin cá nhân";
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      }
    };

    init();
  }, [user, BACKEND_URL]);

  useEffect(() => {
    if (filesContent.length > 0) {
      setFormData(prev => ({ ...prev, avatar: filesContent[0].content }));
    }
  }, [filesContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg({ message: "", isError: false });
    setIsLoading(true);

    try {
        const payload = {
            ...formData
        };

        await api.put("/edit/user", payload);

        setStatusMsg({ message: "Cập nhật thành công!", isError: false });
        
        setTimeout(() => {
           window.location.reload(); 
        }, 1000);

    } catch (error: any) {
        console.error(error);
        setStatusMsg({ 
            message: error.response?.data || "Lỗi cập nhật! Vui lòng kiểm tra lại.", 
            isError: true 
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="py-[60px] bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="font-bold text-2xl text-gray-800 mb-6">
            Cài đặt thông tin cá nhân
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* --- CỘT TRÁI: THÔNG TIN CƠ BẢN --- */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-full">
                    <h2 className="font-bold text-lg mb-4 text-gray-700 border-b pb-2">Thông tin chung</h2>
                    
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group w-32 h-32">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center">
                                {formData.avatar ? (
                                    <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <FaUser className="text-gray-400 text-4xl"/>
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => openFilePicker()}
                                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all shadow-sm border-2 border-white cursor-pointer"
                                title="Đổi ảnh đại diện"
                            >
                                <FaPen size={12} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {fileLoading ? "Đang tải..." : "Định dạng: .jpg, .png"}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium text-sm text-gray-700 mb-1">Họ tên *</label>
                            <input type="text" required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full h-10 border border-gray-300 rounded px-3 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-sm text-gray-700 mb-1">Email</label>
                            <input type="email" readOnly
                                value={formData.email}
                                className="w-full h-10 border border-gray-200 rounded px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-sm text-gray-700 mb-1">Số điện thoại</label>
                            <input type="text" 
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full h-10 border border-gray-300 rounded px-3 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CỘT PHẢI: CHI TIẾT --- */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-full">
                    <h2 className="font-bold text-lg mb-4 text-gray-700 border-b pb-2">Thông tin nghề nghiệp</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block font-medium text-sm text-gray-700 mb-1">Vị trí mong muốn</label>
                            <input type="text" 
                                placeholder="VD: Java Developer, Tester..."
                                value={formData.lookingfor}
                                onChange={e => setFormData({...formData, lookingfor: e.target.value})}
                                className="w-full h-10 border border-gray-300 rounded px-3 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-sm text-gray-700 mb-1">Trạng thái tìm việc</label>
                            <select 
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value})}
                                className="w-full h-10 border border-gray-300 rounded px-3 focus:border-blue-500 focus:outline-none bg-white"
                            >
                                {USER_STATUS.map(st => (
                                    <option key={st.value} value={st.value}>{st.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-medium text-sm text-gray-700 mb-1">Khu vực sinh sống</label>
                            <select 
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                className="w-full h-10 border border-gray-300 rounded px-3 focus:border-blue-500 focus:outline-none bg-white"
                            >
                                <option value="">-- Chọn thành phố --</option>
                                {locations.map(loc => (
                                    <option key={loc.abbreviation} value={loc.abbreviation}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium text-sm text-gray-700 mb-1">Địa chỉ chi tiết</label>
                            <input type="text" 
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full h-10 border border-gray-300 rounded px-3 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium text-sm text-gray-700 mb-1">Giới thiệu bản thân (Bio)</label>
                            <textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full h-32 border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:outline-none resize-y transition-colors"
                                placeholder="Giới thiệu ngắn gọn về kinh nghiệm, kỹ năng của bạn..."
                            />
                        </div>

                        {/* Nút Lưu */}
                        <div className="md:col-span-2 pt-4 border-t mt-2 flex items-center gap-4">
                            <button 
                                type="submit"
                                disabled={isLoading} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded transition-colors disabled:bg-blue-300 min-w-[120px]"
                            >
                                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                            
                            {statusMsg.message && (
                                <span className={`text-sm font-medium ${statusMsg.isError ? "text-red-500" : "text-green-600"}`}>
                                    {statusMsg.message}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </form>
      </div>
    </div>
  )
}