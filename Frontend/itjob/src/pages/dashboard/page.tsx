import { Link, Outlet } from "react-router";
import { useEffect } from "react";
import {
    LifeBuoy,
    Receipt,
    Boxes,Package,
    UserCircle,
    BarChart,LayoutDashboard, 
    Settings,
    BarChart3,
    LogOut
} from 'lucide-react'
import Sidebar from "../../components/side_bar/Sidebar";
import { SidebarItem } from "../../components/side_bar/SidebarItem";

export default function DashboardLayout() {
  useEffect(() => {
    document.title = "Quản lý công việc";
  }, []);
  const logo = {
    logo_sidebar:"/assets/images/logo_sidebar.svg"
  }
  return (
    <>
        <div className="ml-0 h-auto flex justify-center">
          <Sidebar>
            <SidebarItem icon={<LayoutDashboard size={20}/>}
            text="Dashboard"
            alert/>
            <SidebarItem 
            icon={<BarChart3 size={20}/>}
            text="Quản lý công việc"
            />
            <SidebarItem
            icon={<UserCircle size={20}/>}
            text="Quản lý CV"
            />
            <SidebarItem
            icon={<Boxes size={20}/>}
            text="Chi tiết công ty"
            alert/>
            <SidebarItem
            icon={<Package size={20}/>}
            text="Orders"
            alert/>
            <SidebarItem
            icon={<Receipt size={20}/>}
            text="Billings"
            />
            <hr className="my-3" />
            
            <SidebarItem
            icon={<Settings size={20}/>}
            text="Cài đặt chung"
            />
            <SidebarItem
            icon={<LifeBuoy size={20}/>}
            text="Help"
            />
            <SidebarItem
            icon={<LogOut size={20}/>}
            text="Đăng xuất"
            style={{
              color: "red"
            }}
            />
          </Sidebar>
            <div className="flex-1 pt-[30px] pb-[60px] px-6">
            <Outlet />
          </div>
        </div>
    </>
  );
}