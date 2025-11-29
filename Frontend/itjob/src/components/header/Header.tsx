import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router';
import { HeaderMenu } from './HeaderMenu';
import HeaderHoverItem from './HeaderHoverItem';
import HeaderItem from './HeaderItem';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export const Header = () => {

  const { isAuthenticated, user } = useAuth();
  const [topCompanies, setTopCompanies] = useState([]);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const fetchTopCompanies = async () => {
    try {
      // Gọi đúng đường dẫn api/public
      const response = await axios.get(`${BACKEND_URL}/company/list?limit=3`);
      setTopCompanies(response.data);

    }
    catch (error) {
      console.error("Lỗi:", error);
    }
  };
  useEffect(() => {
    fetchTopCompanies();
  }, []);

  const logoutFunction = () => {
    localStorage.removeItem('token');
    window.location.reload();
    window.location.href = "/";
  }
  return (
    <>
      <header className="bg-[#000071] py-[15px]">
        <div className="container">
          <div className="flex justify-between items-center">

            <Link
              to="/"
              className=""
            >
              <img src="/assets/images/logo.svg" alt="" className="" />
            </Link>

            <nav>
              <ul className="flex gap-x-[30px] flex-wrap">

                <HeaderHoverItem toHref='/search' linkText='Việc Làm IT'>
                  <HeaderMenu>
                    <HeaderHoverItem item toHref='/search' linkText='Việc làm IT theo kỹ năng'>
                      <HeaderMenu item>
                        <HeaderItem to='/search?query=reactjs' linkText='ReactJS' />
                        <HeaderItem to='/search?query=nodejs' linkText='NodeJS' />
                        <HeaderItem to='/search?query=js' linkText='Javascript' />
                        <HeaderItem to='/search?query=html' linkText='HTML5' />
                        <HeaderItem to='/search?query=css' linkText='CSS3' />
                      </HeaderMenu>
                    </HeaderHoverItem>
                    <HeaderItem to='/search?company=LG' linkText='Việc làm IT theo công ty' />
                    <HeaderItem to='/search?city=HN' linkText='Việc làm IT theo thành phố' />
                  </HeaderMenu>
                </HeaderHoverItem>

                <HeaderHoverItem toHref='/top' linkText='Top Công Ty IT'>
                  <HeaderMenu>
                    {/* Nếu có dữ liệu thì map ra, nếu không thì hiện text loading */}
                    {topCompanies.length > 0 ? (
                      topCompanies.map((company) => (
                        <HeaderItem
                          key={company.id}
                          to={`/company/${company.id}`} // Link đến trang chi tiết
                          linkText={company.name}        // Tên công ty từ API
                        />
                      ))
                    ) : (
                      // Hardcode tạm 1 cái hoặc loading nếu chưa tải xong
                      <span className="block px-4 py-2 text-white text-sm">Đang tải...</span>
                    )}
                  </HeaderMenu>
                </HeaderHoverItem>

              </ul>
            </nav>
            <div className="font-[600] text-[16px] text-white inline-flex gap-x-[5px] relative">
              {
                isAuthenticated && !!user ?
                  <HeaderHoverItem toHref='#' linkText={user.name}>
                    <HeaderMenu>
                      {
                        user.role == "ROLE_COMPANY" ? (<>
                          <HeaderItem to={`/company/${user.id}`} linkText="Thông tin công ty" />
                          <HeaderItem to='/dashboard/company/job' linkText="Quản lý công việc" />
                        </>
                        ) : (
                          <>
                            <HeaderItem to={`/user/${user.id}`} linkText="Thông tin cá nhân" />
                            <HeaderItem to={`/dashboard/cv`} linkText='Xem CV đã nộp' />
                          </>
                        )
                      }
                      <HeaderItem to="/dashboard/setting" linkText='Cài đặt chung' />
                      <HeaderItem to='/' onClick={() => logoutFunction()} linkText="Đăng xuất" />
                    </HeaderMenu>
                  </HeaderHoverItem>
                  :
                  <Link to="/login">Đăng nhập</Link>
              }
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
