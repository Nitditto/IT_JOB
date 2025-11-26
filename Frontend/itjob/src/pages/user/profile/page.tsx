import { useEffect, useState } from "react";
import { useParams } from "react-router";
import api from "@/utils/api";
import translation from "@/utils/translation";
import { 
    FaEnvelope, 
    FaPhone, 
    FaLocationDot, 
    FaBriefcase, 
    FaUserTie, 
    FaMapLocationDot 
} from "react-icons/fa6";
import { User } from "lucide-react";

interface Location {
    abbreviation: string;
    name: string;
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    avatar: string;
    phone: string;
    description: string;
    status: string; // Enum string
    lookingfor: string;
    address: string;
    location: Location;
}

export default function UserDetailPage() {
  const { id } = useParams(); 
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/user/${id}`); 
        setUserInfo(res.data);
        document.title = `Hồ sơ: ${res.data.name}`;
      } catch (error) {
        console.error("Lỗi tải thông tin user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (isLoading) return <div className="py-20 text-center">Đang tải hồ sơ...</div>;
  if (!userInfo) return <div className="py-20 text-center">Không tìm thấy ứng viên.</div>;

  // Helper render badge trạng thái
  const renderStatusBadge = (status: string) => {
      let colorClass = "bg-gray-100 text-gray-600";
      // Mapping màu sắc cho đẹp
      if (status === "INACTIVE") colorClass = "bg-green-100 text-green-700 border-green-200"; 
      if (status === "FREELANCER") colorClass = "bg-blue-100 text-blue-700 border-blue-200";
      
      // Dùng translation để dịch EN -> VN
      const label = translation[status.toLowerCase()] || status;
      
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
            {label}
        </span>
      );
  }

  return (
    <div className="py-[60px] bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-1">
            <div className="bg-white rounded-[8px] border border-[#DEDEDE] p-6 shadow-sm sticky top-[20px]">
                <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 bg-gray-100 flex items-center justify-center">
                        {userInfo.avatar ? (
                            <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                        ) : (
                            <FaUserTie className="text-gray-400 text-5xl" />
                        )}
                    </div>

                    {/* Tên & Status */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{userInfo.name}</h1>
                    <div className="mb-6">
                        {renderStatusBadge(userInfo.status)}
                    </div>

                    {/* Contact Info */}
                    <div className="w-full space-y-4 border-t pt-6 text-left">
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FaEnvelope />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium truncate" title={userInfo.email}>{userInfo.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <FaPhone />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Số điện thoại</p>
                                <p className="text-sm font-medium">{userInfo.phone || "Chưa cập nhật"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


          </div>
          
          <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Thông tin nghề nghiệp */}
              <div className="bg-white rounded-[8px] border border-[#DEDEDE] p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600"/> Thông tin chung
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-sm text-gray-500 mb-1 block">Vị trí mong muốn</label>
                          <div className="flex items-center gap-2 text-gray-800 font-medium">
                              <FaBriefcase className="text-gray-400"/>
                              {userInfo.lookingfor || "Chưa cập nhật"}
                          </div>
                      </div>

                      <div>
                          <label className="text-sm text-gray-500 mb-1 block">Khu vực sinh sống</label>
                          <div className="flex items-center gap-2 text-gray-800 font-medium">
                              <FaLocationDot className="text-gray-400"/>
                              {userInfo.location?.name || "Chưa cập nhật"}
                          </div>
                      </div>

                      <div className="md:col-span-2">
                          <label className="text-sm text-gray-500 mb-1 block">Địa chỉ chi tiết</label>
                          <div className="flex items-center gap-2 text-gray-800">
                              <FaMapLocationDot className="text-gray-400"/>
                              {userInfo.address || "Chưa cập nhật"}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Card 2: Giới thiệu bản thân */}
              <div className="bg-white rounded-[8px] border border-[#DEDEDE] p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Giới thiệu bản thân</h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {userInfo.description ? (
                          userInfo.description
                      ) : (
                          <span className="italic text-gray-400">Ứng viên chưa cập nhật phần giới thiệu.</span>
                      )}
                  </div>
              </div>
          </div>
        </div>
    </div>
    </div>
  );
}