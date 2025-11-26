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

  // Component Card nhỏ để tái sử dụng
  const SettingCard = ({ to, icon: Icon, title, desc, colorClass, onClick }: any) => {
    const Wrapper = to ? Link : 'div';
    return (
      <Wrapper
        to={to}
        onClick={onClick}
        className="group relative flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass} bg-opacity-10`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          <p className="text-sm text-gray-500">{desc}</p>
        </div>
        <ChevronRight className="text-gray-300 group-hover:text-indigo-500 transition-colors" size={20} />
      </Wrapper>
    )
  }

  return (
    <>
      <div className="pt-[30px] pb-[60px] min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-bold text-3xl text-gray-900 mb-2">
            Cài đặt tài khoản
          </h2>
          <p className="text-gray-500 mb-8">Quản lý thông tin cá nhân và bảo mật</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingCard
              to={isCompany ? "/dashboard/settings/company-profile" : "/dashboard/settings/user-profile"}
              icon={Pen}
              title={isCompany ? "Thông tin công ty" : "Thông tin cá nhân"}
              desc={isCompany ? "Cập nhật logo, địa chỉ và mô tả công ty" : "Cập nhật tên, avatar và thông tin cơ bản"}
              colorClass="bg-blue-500 text-blue-600"
            />
            <SettingCard
              to="/dashboard/settings/change-password"
              icon={KeyRound}
              title="Đổi mật khẩu"
              desc="Bảo vệ tài khoản với mật khẩu mạnh hơn"
              colorClass="bg-indigo-500 text-indigo-600"
            />
            <div className="md:col-span-2 mt-4 pt-6 border-t border-gray-200">
              <h3 className="text-red-600 font-semibold mb-3">Vùng nguy hiểm</h3>
              <SettingCard
                onClick={() => setIsDeleteDialogOpen(true)}
                icon={UserRoundX}
                title="Xóa tài khoản"
                desc="Hành động này không thể hoàn tác. Mọi dữ liệu sẽ bị mất."
                colorClass="bg-red-500 text-red-600"
              />
            </div>
            {/* <div 
                onClick={() => setIsDeleteDialogOpen(true)} // Bấm vào thì mở Dialog
                className="font-medium rounded-md cursor-pointer bg-gradient-to-tr from-indigo-200 to-indigo-100 text-gray-600 flex items-center justify-between gap-2 px-6 py-5 text-2xl hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <UserRoundX className='' size={30}/>
                <span className="">Xóa tài khoản</span>
              </div> */}
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