import { useEffect, useState } from 'react'
import { Link } from 'react-router';
import { HeaderMenu } from './HeaderMenu';
import HeaderHoverItem from './HeaderHoverItem';
import HeaderItem from './HeaderItem';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Moon, Sun } from 'lucide-react';

export const Header = () => {
  const { isAuthenticated, user } = useAuth();
  const [topCompanies, setTopCompanies] = useState([]);
  const [tagList, setTagList] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // Check initial theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const fetchTopCompanies = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/company/list?limit=3`);
      setTopCompanies(response.data);
      const tagRes = await axios.get(`${BACKEND_URL}/job/tags`);
      setTagList(tagRes.data);
    } catch (error) {
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
      <header className="sticky top-0 z-50 glass-panel border-b border-white/20 dark:border-white/10 py-[15px] transition-colors duration-300">
        <div className="container">
          <div className="flex justify-between items-center">
            <div className="flex items-center xl:gap-x-10 gap-x-6">
              <Link to="/">
                {/* Optional: Modify logo coloring if needed or keep existing SVG */}
                <img src="/assets/images/logo.svg" alt="IT.JOB Logo" className="h-8" />
              </Link>
              
              <nav className="hidden lg:flex items-center gap-x-2">
                <HeaderHoverItem toHref='/search' linkText='Tìm việc làm'>
                  <HeaderMenu>
                    <HeaderItem to='/search' linkText='Việc làm mới nhất' />
                    <HeaderItem to='/search?tags=React' linkText='Việc làm ReactJS' />
                    <HeaderItem to='/search?tags=Java' linkText='Việc làm Java' />
                    <HeaderItem to='/search?location=HN' linkText='Việc làm tại Hà Nội' />
                    <HeaderItem to='/search?location=SG' linkText='Việc làm tại Hồ Chí Minh' />
                  </HeaderMenu>
                </HeaderHoverItem>

                <HeaderHoverItem toHref='#' linkText='Hồ sơ & CV'>
                  <HeaderMenu>
                    <HeaderItem to='#' linkText='Tạo CV mới' />
                    <HeaderItem to='#' linkText='Quản lý CV' />
                    <HeaderItem to='#' linkText='Hướng dẫn viết CV' />
                  </HeaderMenu>
                </HeaderHoverItem>

                <HeaderHoverItem toHref='#' linkText='Công ty'>
                  <HeaderMenu>
                    <HeaderItem to='#' linkText='Danh sách công ty' />
                    <HeaderItem to='#' linkText='Top công ty IT' />
                  </HeaderMenu>
                </HeaderHoverItem>
              </nav>
            </div>

            <div className="font-[600] text-[15px] text-foreground dark:text-white inline-flex xl:gap-x-4 gap-x-2 items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {isAuthenticated && !!user ? (
                <HeaderHoverItem toHref='#' linkText={user.name}>
                  <HeaderMenu>
                    {user.role == "ROLE_COMPANY" ? (
                      <>
                        <HeaderItem to={`/company/${user.id}`} linkText="Thông tin công ty" />
                        <HeaderItem to='/dashboard/company/job' linkText="Quản lý công việc" />
                      </>
                    ) : (
                      <>
                        <HeaderItem to={`/user/${user.id}`} linkText="Thông tin cá nhân" />
                        <HeaderItem to={`/dashboard/cv`} linkText='Xem CV đã nộp' />
                      </>
                    )}
                    <HeaderItem to="/dashboard/setting" linkText='Cài đặt chung' />
                    <HeaderItem to='/' onClick={logoutFunction} linkText="Đăng xuất" />
                  </HeaderMenu>
                </HeaderHoverItem>
              ) : (
                <>
                  <Link
                    to="/company-register"
                    className="hidden lg:flex px-4 py-2 text-[14px] font-[600] text-foreground dark:text-white hover:text-[#00b14f] transition-colors relative after:content-[''] after:absolute after:right-[-12px] after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-px after:bg-slate-300 dark:after:bg-slate-700 mr-4"
                  >
                    Nhà Tuyển Dụng
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:flex px-4 py-2 rounded-full border border-[#00b14f] text-[#00b14f] hover:bg-[#00b14f]/5 transition-colors font-medium whitespace-nowrap"
                  >
                    Đăng ký
                  </Link>
                  <Link
                    to="/login"
                    className="bg-[#00b14f] text-white px-5 py-2 rounded-full hover:bg-[#00b14f]/90 transition-all hover:shadow-md font-medium whitespace-nowrap"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
