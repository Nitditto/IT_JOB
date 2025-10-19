import { Link, Outlet } from "react-router";
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
          <div className="w-1/4 max-w-[250px] border-r-1 flex flex-col">
            <div className="px-8">
              <img className="" src={logo.logo_sidebar} alt="logo" />
            </div>
            <Link to="./company/job">baasd</Link>
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