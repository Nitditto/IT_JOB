import { Info, UserStar } from 'lucide-react';
import React, { useEffect } from 'react'
import {Link} from 'react-router'
import { PiUserCircleGearFill, PiUserCirclePlusBold } from "react-icons/pi";
import { useAuth } from '@/context/AuthContext';
const Settings = () => {
  const { user } = useAuth();
  const isCompany = user?.role === "ROLE_COMPANY";

  useEffect(()=>{
      document.title="Settings";
    },[])
    return (
      <>
        <div className=" pt-[30px] pb-[60px]">
          <div className="container">
            <h2 className="font-semibold text-3xl">
              Cài đặt chung 
            </h2>
            <div className="flex mt-5 gap-[32px] items-center">
              <Link 
              to={isCompany ? "/dashboard/settings/company-profile" : "/dashboard/settings/user-profile"}
              className="font-medium rounded-md cursor-pointer bg-gradient-to-tr from-indigo-200 to-indigo-100 text-gray-600 flex items-center justify-between gap-2 px-6 py-5 text-2xl">
                <Info className='' size={30}/>
                <span className="">
                  {isCompany ? "Thông tin công ty" : "Thông tin cá nhân"}
                </span>
              </Link>
              <Link to="#" className="font-medium rounded-md cursor-pointer bg-gradient-to-tr from-indigo-200 to-indigo-100 text-gray-600 flex items-center justify-between gap-2 px-6 py-5 text-2xl">
                <PiUserCircleGearFill className='' size={30}/>
                <Link to="/dashboard/settings/change-password" className="">Đổi mật khẩu</Link>
              </Link>
              
              <Link to="#" className="font-medium rounded-md cursor-pointer bg-gradient-to-tr from-indigo-200 to-indigo-100 text-gray-600 flex items-center justify-between gap-2 px-6 py-5 text-2xl">
                <PiUserCirclePlusBold className='' size={30}/>
                <Link to={"#"} className="">Xóa tài khoản</Link>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
}

export default Settings