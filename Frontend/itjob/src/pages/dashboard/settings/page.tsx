import { KeyRound, Pen, UserRoundX, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router' // Hoặc 'react-router-dom' tùy version
import { useAuth } from '@/context/AuthContext'
import { DeleteAccountDialog } from './deleteAccount/page'

const Settings = () => {
    const { user } = useAuth()
    const isCompany = user?.role === 'ROLE_COMPANY'
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    useEffect(() => {
        document.title = 'Cài đặt chung'
    }, [])

    const SettingCard = ({
        to,
        icon: Icon,
        title,
        desc,
        colorClass,
        borderClass,
        onClick,
    }: any) => {
        const Wrapper = to ? Link : 'div'
        return (
            <Wrapper
                to={to}
                onClick={onClick}
                className="group relative flex cursor-pointer items-start gap-4 border-b border-slate-100 p-5 transition-colors last:border-0 hover:bg-slate-50"
            >
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-[10px] border ${borderClass} flex-shrink-0`}
                >
                    <Icon size={20} className={`${colorClass}`} />
                </div>
                <div className="mt-0.5 flex-1">
                    <h3 className="text-[15px] font-semibold text-slate-800">
                        {title}
                    </h3>
                    <p className="mt-1 text-[13px] text-slate-500">{desc}</p>
                </div>
                <ChevronRight
                    className="mt-2 text-slate-300 transition-colors group-hover:text-indigo-500"
                    size={18}
                />
            </Wrapper>
        )
    }

    return (
        <>
            <div className="min-h-full p-4 md:p-8">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Cài đặt
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Quản lý tùy chọn và bảo mật tài khoản cá nhân tại
                            đây.
                        </p>
                    </div>

                    <div className="mb-6 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Hồ sơ & Bảo Mật
                            </h3>
                        </div>
                        <div className="flex flex-col">
                            <SettingCard
                                to={
                                    isCompany
                                        ? '/dashboard/settings/company-profile'
                                        : '/dashboard/settings/user-profile'
                                }
                                icon={Pen}
                                title={
                                    isCompany
                                        ? 'Thông tin công ty'
                                        : 'Thông tin hồ sơ'
                                }
                                desc={
                                    isCompany
                                        ? 'Cập nhật logo, địa chỉ và mô tả công ty'
                                        : 'Cập nhật tên hiển thị, ảnh đại diện và thông tin cơ bản'
                                }
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

                    <div className="overflow-hidden rounded-[16px] border border-red-100 bg-white shadow-sm">
                        <div className="border-b border-red-50 bg-red-50/30 px-5 py-4">
                            <h3 className="text-sm font-semibold text-red-600">
                                Vùng Nguy Hiểm
                            </h3>
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
    )
}

export default Settings
