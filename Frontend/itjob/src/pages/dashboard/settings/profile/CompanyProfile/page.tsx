import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import axios from "axios";
import { useEffect, useState } from "react";
import { useFilePicker } from "use-file-picker";
import { useNavigate } from "react-router";

const DAYS_OF_WEEK = [
  { value: 2, label: "Thứ 2" },
  { value: 3, label: "Thứ 3" },
  { value: 4, label: "Thứ 4" },
  { value: 5, label: "Thứ 5" },
  { value: 6, label: "Thứ 6" },
  { value: 7, label: "Thứ 7" },
  { value: 8, label: "Chủ Nhật" },
];
export default function CompanyManageProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [locations, setLocations] = useState<Location[]>([]);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [status, setStatus] = useState({ message: "", isError: false });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "", // Logo
    address: "",
    location: "", // Mã vùng (abbreviation)
    description: "",
    model: "",    // "PRODUCT" | "OUTSOURCING"
    scale: "",    // "SMALL", "MEDIUM", "LARGE" ... (Khớp với Enum Java)
    startWork: 2,
    endWork: 6,
    hasOvertime: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { openFilePicker, filesContent, loading, clear } = useFilePicker({
    readAs: 'DataURL',
    accept: 'image/*',
    multiple: false,
  });
  useEffect(() => {
    const init = async () => {
      try {
        const locRes = await axios.get<Location[]>(`${BACKEND_URL}/location`);
        setLocations(locRes.data);

        if (user?.id) {
           // Lấy thông tin chi tiết công ty
           const res = await api.get(`/company/${user.id}`);
           const info = res.data;
           
           setFormData({
             name: info.name || "",
             email: info.email || "",
             phone: info.phone || "",
             avatar: info.avatar || "",
             address: info.address || "",
             // Backend trả về object Location, ta chỉ lấy abbreviation
             location: info.location?.abbreviation || "", 
             description: info.description || "",
             model: info.model || "",
             scale: info.scale || "",
             startWork: info.startWork || 2,
             endWork: info.endWork || 6,
             hasOvertime: info.hasOvertime || false
           });
        }
      } catch (error) {
        console.error(error);
      }
    };
    init();
    document.title = "Thông tin công ty";
  }, [user, BACKEND_URL]);
  // 2. Cập nhật avatar khi chọn file
  useEffect(() => {
    if (filesContent.length > 0) {
      setFormData(prev => ({ ...prev, avatar: filesContent[0].content }));
    }
  }, [filesContent]);

  // 3. Hàm Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.startWork >= formData.endWork) {
        setStatus({ message: "Ngày bắt đầu làm việc phải trước ngày kết thúc!", isError: true });
        return;
    }
    setIsLoading(true);
    try {
        // --- TẠO PAYLOAD MỚI ---
        // Biến đổi dữ liệu trước khi gửi
        const payload = {
            ...formData,
            location: formData.location ? { abbreviation: formData.location } : null
        };

        // Gửi payload này đi (thay vì formData gốc)
        await api.put("/edit/company", payload);
        setStatus({ message: "Cập nhật thông tin thành công!", isError: false });
        setTimeout(() => {
            // Reload trang settings để cập nhật lại context (avatar, tên...)
            // window.location.href = "/dashboard/settings";
            
            // Hoặc dùng navigate nếu không cần reload cứng:
            navigate("/dashboard/settings"); 
            window.location.reload(); 
        }, 1000);

    } catch (error) {
        console.error(error);
        setStatus({ message: "Lỗi cập nhật! Vui lòng kiểm tra lại.", isError: true });
    } finally{
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <div className="rounded-[8px] border border-[#DEDEDE] p-[20px]">
            <h2 className="font-bold text-[20px] mb-[20px] text-black">
              Thông tin công ty
            </h2>
            <form  
            onSubmit={handleSubmit}
            className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]">
              <div className="sm:col-span-2">
                <label className="font-[500] text-[14px] mb-[5px] block">Tên công ty *</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-[500] text-[14px] mb-[5px] block">Logo</label>
                <div className="flex items-center gap-4">
                    {formData.avatar ? (
                        <img src={formData.avatar} className="w-20 h-20 object-contain border rounded p-1" />
                    ) : (
                        <div className="w-20 h-20 border rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">No Logo</div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button type="button" onClick={() => openFilePicker()} variant="outline">
                          {loading ? "Đang tải..." : "Chọn Logo Mới"}
                        </Button>
                        <p className="text-xs text-gray-400">Định dạng: .jpg, .png. Tối đa 5MB</p>
                    </div>
                </div>
              </div>
              <div>
                <label className="font-[500] text-[14px] mb-[5px] block">Email </label>
                <input 
                  type="email" 
                  value={formData.email}
                  readOnly
                  className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px] bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="font-[500] text-[14px] mb-[5px] block">Số điện thoại</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                />
              </div>

              <div>
                 <label className="font-[500] text-[14px] mb-[5px] block">Thành phố</label>
                 <select 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                 >
                    <option value="">Chọn thành phố</option>
                    {locations.map(loc => (
                        <option key={loc.abbreviation} value={loc.abbreviation}>{loc.name}</option>
                    ))}
                 </select>
              </div>

              {/* --- Địa chỉ chi tiết --- */}
              <div>
                <label className="font-[500] text-[14px] mb-[5px] block">Địa chỉ chi tiết</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                />
              </div>

              {/* --- Mô hình công ty --- */}
              <div>
                 <label className="font-[500] text-[14px] mb-[5px] block">Mô hình công ty</label>
                 <select 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                 >
                    <option value="">Chọn mô hình</option>
                    {/* Chỉnh lại value khớp với Enum CompanyModel.java của bạn */}
                    <option value="product">Product (Làm sản phẩm)</option>
                    <option value="service">Service (Dịch vụ)</option>
                 </select>
              </div>

              {/* --- Quy mô công ty --- */}
              <div>
                 <label className="font-[500] text-[14px] mb-[5px] block">Quy mô công ty</label>
                 <select 
                    value={formData.scale}
                    onChange={e => setFormData({...formData, scale: e.target.value})}
                    className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                 >
                    <option value="">Chọn quy mô</option>
                    {/* Chỉnh lại value khớp với Enum CompanyScale.java của bạn */}
                    <option value="small">10 - 150 nhân viên</option>
                    <option value="medium">151 - 300 nhân viên</option>
                    <option value="large">300+ nhân viên</option>
                 </select>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                    <label className="font-[500] text-[14px] mb-[5px] block">Từ</label>
                    <select 
                        value={formData.startWork}
                        onChange={e => setFormData({...formData, startWork: parseInt(e.target.value)})}
                        className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                    >
                        {DAYS_OF_WEEK.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                    </select>
                </div>
                <div className="w-1/2">
                    <label className="font-[500] text-[14px] mb-[5px] block">Đến</label>
                    <select 
                        value={formData.endWork}
                        onChange={e => setFormData({...formData, endWork: parseInt(e.target.value)})}
                        className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                    >
                         {DAYS_OF_WEEK.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                    </select>
                </div>
              </div>

              {/* --- Làm việc ngoài giờ --- */}
              <div>
                 <label className="font-[500] text-[14px] mb-[5px] block">Làm việc ngoài giờ (OT)?</label>
                 <select 
                    value={formData.hasOvertime ? "true" : "false"}
                    onChange={e => setFormData({...formData, hasOvertime: e.target.value === "true"})}
                    className="w-full h-[46px] border border-[#DEDEDE] rounded-[4px] px-[20px]"
                 >
                    <option value="false">Không có OT</option>
                    <option value="true">Có OT</option>
                 </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-[500] text-[14px] mb-[5px] block">Mô tả chi tiết</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full h-[200px] border border-[#DEDEDE] rounded-[4px] px-[20px] py-[10px]"
                />
              </div>

              <div className="sm:col-span-2 mt-4">
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-[20px] h-[48px] bg-[#0088FF] hover:bg-[#0077EE] rounded-[4px] font-bold text-[16px] text-white transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
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
  );
}
