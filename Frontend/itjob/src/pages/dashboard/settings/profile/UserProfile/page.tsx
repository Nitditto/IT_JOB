import { useEffect, useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import api from "../../../../../utils/api";
import axios from "axios";
import { useFilePicker } from 'use-file-picker';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router"; 

// 1. SỬA LỖI TYPE: Đổi tên Location thành JobLocation
import type { Location as JobLocation } from "@/types";

export default function UserManageProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [locations, setLocations] = useState<JobLocation[]>([]);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", isError: false });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    address: "",
    location: "", 
    description: "",
    lookingfor: "", 
    status: "employed"
  });

  const { openFilePicker, filesContent, loading, clear } = useFilePicker({
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
            location: info.location?.abbreviation || "", 
            description: info.description || "",
            lookingfor: info.lookingfor || "",
            status: info.status || "employed"
          });
        }
        document.title = "Thông tin cá nhân";
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
    setStatus({ message: "", isError: false });
    setIsLoading(true);

    try {
        const payload = {
            ...formData
        };

        await api.put("/edit/user", payload);

        setStatus({ message: "Cập nhật thành công!", isError: false });
        
        setTimeout(() => {
           navigate("/dashboard/settings");
           window.location.reload(); 
        }, 1000);

    } catch (error: any) {
        console.error(error);
        setStatus({ 
            message: error.response?.data || "Lỗi cập nhật! Vui lòng kiểm tra lại.", 
            isError: true 
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="py-[60px]">
        <div className="container mx-auto px-[16px]">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <h1 className="font-[700] text-[20px] text-black mb-[20px]">
              Thông tin cá nhân
            </h1>
            
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]">
              
              {/* ... Các input khác giữ nguyên ... */}
              
               <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Họ tên *
                </label>
                <input 
                  type="text" 
                  id="fullName" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-[500] text-[14px] text-black mb-[5px]">Avatar</label>
                <div className="flex items-center gap-4">
                    {formData.avatar ? (
                        <img src={formData.avatar} className="w-20 h-20 object-contain border rounded-full p-1" alt="Avatar" />
                    ) : (
                        <div className="w-20 h-20 border rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">No Img</div>
                    )}
                    <Button type="button" onClick={() => openFilePicker()} variant="outline">
                        {loading ? "Đang tải..." : "Đổi Avatar"}
                    </Button>
                </div>
              </div>

              <div className="">
                <label className="block font-[500] text-[14px] text-black mb-[5px]">Email (Không thể sửa)</label>
                <input 
                  type="email" 
                  value={formData.email}
                  readOnly
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px] bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="">
                <label className="block font-[500] text-[14px] text-black mb-[5px]">Số điện thoại</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                />
              </div>

              <div className="">
                 <label className="block font-[500] text-[14px] text-black mb-[5px]">Thành phố</label>
                 <select 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                 >
                    <option value="">Chọn thành phố</option>
                    {locations.map(loc => (
                        <option key={loc.abbreviation} value={loc.abbreviation}>{loc.name}</option>
                    ))}
                 </select>
              </div>

              <div className="">
                <label className="block font-[500] text-[14px] text-black mb-[5px]">Địa chỉ</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                />
              </div>

              <div className="sm:col-span-2 mt-4">
                <button 
                    type="submit"
                    disabled={isLoading} 
                    className="bg-[#0088FF] rounded-[4px] h-[48px] px-[20px] font-[700] text-[16px] text-white hover:bg-[#0077EE] disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? "Đang cập nhật..." : "Cập nhật"}
                </button>
                
                {status.message && (
                    <div className={`mt-3 text-[14px] font-medium ${status.isError ? "text-red-500" : "text-green-500"}`}>
                        {status.message}
                    </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}