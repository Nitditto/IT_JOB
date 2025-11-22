import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import api from "../../../../utils/api";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    
    // State cho form
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // State cho lỗi/thông báo
    const [status, setStatus] = useState({ message: "", isError: false });

    useEffect(() => {
        document.title = 'Đổi mật khẩu';
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ message: "", isError: false });

        // Validate cơ bản phía Client
        if (formData.newPassword !== formData.confirmPassword) {
            setStatus({ message: "Mật khẩu xác nhận không khớp!", isError: true });
            return;
        }
        if (formData.newPassword.length < 8) {
             setStatus({ message: "Mật khẩu mới phải có ít nhất 8 ký tự!", isError: true });
             return;
        }

        setIsLoading(true);
        try {
            // Gọi API
            await api.put("/auth/change-password", formData);
            
            setStatus({ message: "Đổi mật khẩu thành công!", isError: false });
            
            // Reset form
            setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });

        } catch (error: any) {
            console.error(error);
            setStatus({ 
                message: error.response?.data || "Có lỗi xảy ra, vui lòng thử lại!", 
                isError: true 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-[60px]">
            <div className="container mx-auto px-[16px]">
                <div className="mx-auto max-w-[602px] rounded-[8px] border border-[#DEDEDE] px-[20px] py-[50px]">
                    <h1 className="mb-[20px] text-center text-[20px] font-bold text-black">
                        Đổi mật khẩu
                    </h1>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-[15px]">
                        
                        {/* 1. Mật khẩu hiện tại */}
                        <div>
                            <label className="mb-[5px] block text-[14px] font-[500] text-black">
                                Mật khẩu hiện tại *
                            </label>
                            <input
                                type="password"
                                name="oldPassword"
                                value={formData.oldPassword}
                                onChange={handleChange}
                                required
                                className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] text-black"
                                placeholder="Nhập mật khẩu cũ..."
                            />
                        </div>

                        {/* 2. Mật khẩu mới */}
                        <div>
                            <label className="mb-[5px] block text-[14px] font-[500] text-black">
                                Mật khẩu mới *
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] text-black"
                                placeholder="Nhập mật khẩu mới..."
                            />
                        </div>

                        {/* 3. Xác nhận mật khẩu */}
                        <div>
                            <label className="mb-[5px] block text-[14px] font-[500] text-black">
                                Xác nhận mật khẩu mới *
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] text-black"
                                placeholder="Nhập lại mật khẩu mới..."
                            />
                        </div>

                        {/* Nút Submit */}
                        <div>
                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                className="h-[48px] w-full cursor-pointer rounded-[4px] bg-[#0088FF] px-[20px] text-[16px] font-bold text-white hover:bg-[#0077EE] disabled:bg-gray-400 transition-colors"
                            >
                                {isLoading ? "Đang xử lý..." : "Lưu thay đổi"}
                            </button>
                            
                            {/* Thông báo lỗi/thành công */}
                            {status.message && (
                                <div className={`mt-3 text-center text-[14px] ${status.isError ? "text-red-500" : "text-green-500"}`}>
                                    {status.message}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Link
                                to="/dashboard/setting"
                                className="cursor-pointer text-[14px] text-[#0088FF] hover:underline"
                            >
                                Quay lại Cài đặt
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}