import React, { useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, X, Eye, EyeOff, Trash2 } from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

// Nếu bạn muốn dùng Input của thư viện thì giữ import này, 
// còn không mình đã style sẵn input bằng tailwind ở dưới cho đồng bộ.
// import { Input } from "@/components/ui/input"; 

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const navigate = useNavigate();
  const { logout } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Key xác nhận
  const CONFIRM_KEY = "DELETE-MY-ACCOUNT"; 

  const [formData, setFormData] = useState({
    password: "",
    confirmKey: ""
  });

  const handleDelete = async () => {
    setError("");
    
    // Validate
    if (formData.confirmKey !== CONFIRM_KEY) {
        setError("Mã xác nhận không chính xác.");
        return;
    }
    if (!formData.password) {
        setError("Vui lòng nhập mật khẩu để xác nhận.");
        return;
    }

    setIsLoading(true);
    try {
        // Gọi API xóa (Backend tự xử lý logic xóa DB)
        await api.delete("/auth/delete", {
            data: { password: formData.password } 
        });
        
        // Xóa thành công -> Gọi logout để clear session/cookie
        await logout(); 

        // Redirect về trang chủ
        navigate("/"); 
        
    } catch (err: any) {
        console.error(err);
        // Lấy lỗi từ backend trả về hoặc lỗi mặc định
        setError(err.response?.data?.message || err.response?.data || "Mật khẩu không đúng hoặc có lỗi xảy ra.");
    } finally {
        setIsLoading(false);
    }
  };

  // Nếu dialog đóng thì không render gì cả
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop: Nền tối và mờ */}
      <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => onOpenChange(false)}
      ></div>

      {/* Dialog Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
        
        {/* Nút tắt nhanh */}
        <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
        >
            <X size={20} />
        </button>

        {/* Header Cảnh báo */}
        <div className="flex flex-col items-center pt-8 px-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border-4 border-red-100">
                <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Xóa tài khoản vĩnh viễn?
            </h3>
            <p className="text-gray-500 text-[15px] leading-relaxed">
                Hành động này <span className="text-red-600 font-bold">không thể hoàn tác</span>. 
                Toàn bộ dữ liệu, hồ sơ và lịch sử hoạt động của bạn sẽ bị xóa khỏi hệ thống.
            </p>
        </div>

        {/* Form Nhập liệu */}
        <div className="px-8 py-6 space-y-5">
            
            {/* 1. Nhập mật khẩu */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                    1. Nhập mật khẩu của bạn
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mật khẩu..."
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-gray-800"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* 2. Nhập Key xác nhận */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                    2. Nhập dòng chữ xác nhận bên dưới
                </label>
                <div className="bg-gray-100 p-2.5 rounded-lg text-center font-mono font-bold tracking-widest text-gray-600 select-none border border-dashed border-gray-300 text-sm">
                    {CONFIRM_KEY}
                </div>
                <input
                    type="text"
                    placeholder="Nhập lại dòng chữ trên..."
                    value={formData.confirmKey}
                    onChange={(e) => setFormData({ ...formData, confirmKey: e.target.value })}
                    onPaste={(e) => e.preventDefault()} // Chặn paste cho an toàn
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-gray-800 placeholder:text-gray-400"
                />
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600 font-medium animate-in slide-in-from-top-1">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center gap-3 p-6 bg-gray-50 border-t border-gray-100">
            <button
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
                Hủy bỏ
            </button>
            <button
                disabled={isLoading || formData.confirmKey !== CONFIRM_KEY || !formData.password}
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <>
                        <Trash2 size={18} /> Xóa tài khoản
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
}