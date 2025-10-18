import { Outlet } from "react-router";
import { useEffect } from "react";

export default function DashboardLayout() {
  useEffect(() => {
    document.title = "Quản lý công việc";
  }, []);
  const logo = {
    logo_sidebar:"/assets/images/logo_sidebar.svg"
  }
  return (
    <>
      <div className="">
        <div className="ml-0 flex">
          <div className="max-w-[500px] border-r-1 mx-auto flex flex-col">
            <div className="px-8">
              <img className="" src={logo.logo_sidebar} alt="logo" />
            </div>
            <div className="">
              <div className="">
                
              </div>
            </div>
          </div>
            <Outlet/>
        </div>
      </div>
    </>
  );
}