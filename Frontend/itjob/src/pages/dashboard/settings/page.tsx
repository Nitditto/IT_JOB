import { KeyRound, Pen, UserRoundX, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react'
import { Link } from 'react-router' // Hoặc 'react-router-dom' tùy version
import { useAuth } from '@/context/AuthContext';
import { DeleteAccountDialog } from './deleteAccount/page';

const Settings = () => {
  const { user } = useAuth();
  const isCompany = user?.role === "ROLE_COMPANY";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    document.title = "Cài đặt chung";
  }, [])

  const SettingCard = ({ to, icon: Icon, title, desc, colorClass, borderClass, onClick }: any) => {
    const Wrapper = to ? Link : 'div';
    return (
      <Wrapper
        to={to}
        onClick={onClick}
        className="group relative flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
      >
        <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center border ${borderClass} flex-shrink-0`}>
             <Icon size={20} className={`${colorClass}`} />
        </div>
        <div className="flex-1 mt-0.5">
          <h3 className="font-semibold text-slate-800 text-[15px]">{title}</h3>
          <p className="text-[13px] text-slate-500 mt-1">{desc}</p>
        </div>
        <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors mt-2" size={18} />
      </Wrapper>
    )
  }

  return (
    <>
      <div className="p-4 md:p-8 min-h-full">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="font-bold text-2xl text-slate-900">Cài đặt</h2>
            <p className="text-slate-500 text-sm mt-1">Quản lý tùy chọn và bảo mật tài khoản cá nhân tại đây.</p>
          </div>

          <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 text-sm">Hồ sơ & Bảo Mật</h3>
            </div>
            <div className="flex flex-col">
              <SettingCard
                to={isCompany ? "/dashboard/settings/company-profile" : "/dashboard/settings/user-profile"}
                icon={Pen}
                title={isCompany ? "Thông tin công ty" : "Thông tin hồ sơ"}
                desc={isCompany ? "Cập nhật logo, địa chỉ và mô tả công ty" : "Cập nhật tên hiển thị, ảnh đại diện và thông tin cơ bản"}
                colorClass="text-indigo-600"
                borderClass="border-indigo-100 bg-indigo-50/50"
              />
              <SettingCard
                to="/dashboard/settings/change-password"
                icon={KeyRound}
                title="Đổi mật khẩu"
                desc="Bảo vệ tài khoản bằng việc thay đổi mật khẩu định kỳ"
                colorClass="text-emerald-600"
                borderClass="border-emerald-100 bg-emerald-50/50"
              />
            </div>
          </div>

          <div className="bg-white rounded-[16px] shadow-sm border border-red-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-50 bg-red-50/30">
              <h3 className="font-semibold text-red-600 text-sm">Vùng Nguy Hiểm</h3>
            </div>
            <div className="flex flex-col">
              <SettingCard
                onClick={() => setIsDeleteDialogOpen(true)}
                icon={UserRoundX}
                title="Xóa tài khoản"
                desc="Xóa toàn bộ dữ liệu vĩnh viễn và không thể khôi phục"
                colorClass="text-red-600"
                borderClass="border-red-100 bg-red-50/50"
              />
            </div>
          </div>
        </div>
      </div>

      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}

export default Settings;