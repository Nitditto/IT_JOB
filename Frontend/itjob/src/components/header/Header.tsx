import { useEffect, useState } from 'react'
import { Link } from 'react-router';
import { HeaderMenu } from './HeaderMenu';
import HeaderHoverItem from './HeaderHoverItem';
import HeaderItem from './HeaderItem';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Moon, Sun, Menu, X, ChevronDown, User, LogOut, Settings, Briefcase, FileText, Building2, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const Header = () => {
  const { isAuthenticated, user } = useAuth();
  const [topCompanies, setTopCompanies] = useState([]);
  const [tagList, setTagList] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800/80 shadow-sm'
          : 'bg-white/60 dark:bg-slate-950/60 backdrop-blur-md border-transparent'
        }`}>
        <div className="container">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-x-8">
              <Link to="/" className="flex items-center gap-2 group">
                <img src="/assets/images/logo.svg" alt="IT.JOB Logo" className="h-8 group-hover:opacity-80 transition-opacity" />
              </Link>

              <nav className="hidden lg:flex items-center gap-x-1">
                <HeaderHoverItem toHref='/search' linkText='Tìm việc làm'>
                  <HeaderMenu>
                    <HeaderItem to='/search' linkText='Việc làm mới nhất' />
                    {tagList.slice(0, 4).sort((a: any, b: any) => b.jobCount - a.jobCount).map((value: any, index) => (
                      <HeaderItem key={index} to={`/search?tags=${value["tag"]}`} linkText={`Việc làm ${value["tag"]}`} />
                    ))}
                    <HeaderItem to='/search?location=HN' linkText='Việc làm tại Hà Nội' />
                    <HeaderItem to='/search?location=SG' linkText='Việc làm tại Hồ Chí Minh' />
                  </HeaderMenu>
                </HeaderHoverItem>

                <HeaderHoverItem toHref='#' linkText='Hồ sơ & CV'>
                  <HeaderMenu>
                    <HeaderItem to='/dashboard/cv/templates' linkText='Mẫu CV' />
                    <HeaderItem to='/dashboard/cv' linkText='Quản lý CV' />
                    <HeaderItem to='/dashboard/cv/upload-review' linkText='AI Đánh giá CV' />
                    <HeaderItem to='/dashboard/settings/user-profile' linkText='Cập nhật hồ sơ' />
                  </HeaderMenu>
                </HeaderHoverItem>

                <HeaderHoverItem toHref='#' linkText='Công ty'>
                  <HeaderMenu>
                    <HeaderItem to='/search' linkText='Danh sách công ty' />
                    {topCompanies.map((value: any, index) => (
                      <HeaderItem key={index} to={`/search?companyID=${value.id}`} linkText={value.name} />
                    ))}
                  </HeaderMenu>
                </HeaderHoverItem>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-x-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-foreground dark:text-white"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {isAuthenticated && !!user ? (
                /* Logged In — User Menu */
                <HeaderHoverItem toHref='#' linkText={user.name}>
                  <HeaderMenu>
                    {/* User Info Header */}
                    <li className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mx-2 mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </li>

                    {user.role == "ROLE_COMPANY" ? (
                      <>
                        <HeaderItem to={`/company/${user.id}`} linkText="Thông tin công ty" />
                        <HeaderItem to='/dashboard/company/job' linkText="Quản lý công việc" />
                      </>
                    ) : user.role == "ROLE_ADMIN" ? (
                      <>
                        <HeaderItem to={`/dashboard/home`} linkText="Admin Dashboard" />
                        <HeaderItem to={`/dashboard/admin/register`} linkText="Cấp tài khoản công ty" />
                      </>
                    ) : (
                      <>
                        <HeaderItem to={`/user/${user.id}`} linkText="Thông tin cá nhân" />
                        <HeaderItem to={`/dashboard/cv`} linkText='Xem CV đã nộp' />
                        <HeaderItem to={`/dashboard/home`} linkText='Dashboard' />
                      </>
                    )}

                    <li className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 mx-2">
                      <div />
                    </li>
                    <HeaderItem to="/dashboard/setting" linkText='Cài đặt chung' />
                    <HeaderItem to='/' onClick={logoutFunction} linkText="Đăng xuất" />
                  </HeaderMenu>
                </HeaderHoverItem>
              ) : (
                /* Not Logged In */
                <>
                  <Link
                    to="/company-register"
                    className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Nhà Tuyển Dụng
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all text-sm font-semibold"
                  >
                    Đăng ký
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-foreground dark:text-white ml-1"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950"
            >
              <nav className="container py-4 space-y-1">
                <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <Briefcase size={18} className="text-indigo-500" /> Tìm việc làm
                </Link>
                <Link to="/dashboard/cv/templates" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <FileText size={18} className="text-violet-500" /> Hồ sơ & CV
                </Link>
                <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <Building2 size={18} className="text-emerald-500" /> Công ty
                </Link>
                {isAuthenticated && user && (
                  <>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-2" />
                    <Link to="/dashboard/home" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <User size={18} className="text-indigo-500" /> Dashboard
                    </Link>
                    <Link to="/dashboard/setting" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <Settings size={18} className="text-slate-400" /> Cài đặt
                    </Link>
                  </>
                )}
                {!isAuthenticated && (
                  <>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-2" />
                    <div className="flex gap-3 px-4 pt-2">
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
                        Đăng ký
                      </Link>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        Đăng nhập
                      </Link>
                    </div>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
