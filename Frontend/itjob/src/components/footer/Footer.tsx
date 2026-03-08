import { Link } from 'react-router';
import { Briefcase, FileText, Building2, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* Main Footer */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src="/assets/images/logo.svg" alt="IT.JOB" className="h-8 brightness-0 invert opacity-90" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-xs">
              Nền tảng tìm kiếm việc làm IT hàng đầu Việt Nam. Kết nối ứng viên tài năng với các nhà tuyển dụng hàng đầu.
            </p>
            <div className="flex gap-3">
              {/* Social Icons */}
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-indigo-600 flex items-center justify-center transition-colors group" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 group-hover:text-white transition-colors">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-indigo-600 flex items-center justify-center transition-colors group" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 group-hover:text-white transition-colors">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-indigo-600 flex items-center justify-center transition-colors group" aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 group-hover:text-white transition-colors">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase size={14} className="text-indigo-400" />
              Dành cho ứng viên
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/search" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Tìm việc làm IT</Link></li>
              <li><Link to="/dashboard/cv/templates" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Tạo CV chuyên nghiệp</Link></li>
              <li><Link to="/dashboard/cv/upload-review" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">AI Đánh giá CV</Link></li>
              <li><Link to="/dashboard/home" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Dashboard thông minh</Link></li>
              <li><Link to="/register" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Đăng ký tài khoản</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 size={14} className="text-violet-400" />
              Dành cho nhà tuyển dụng
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/company-register" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">Đăng ký tuyển dụng</Link></li>
              <li><Link to="/dashboard/company/job/create" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">Đăng tin tuyển dụng</Link></li>
              <li><Link to="/dashboard/company/job" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">Quản lý tin tuyển dụng</Link></li>
              <li><Link to="/search" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">Tìm kiếm ứng viên</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Mail size={14} className="text-emerald-400" />
              Liên hệ
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-400">Hà Nội, Việt Nam</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <a href="mailto:contact@itjob.vn" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">contact@itjob.vn</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <a href="tel:+84123456789" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">+84 123 456 789</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {currentYear} IT.JOB — Nền tảng việc làm IT hàng đầu Việt Nam
          </p>
          <div className="flex items-center gap-4">
            <Link to="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Điều khoản sử dụng</Link>
            <span className="text-slate-700">·</span>
            <Link to="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Chính sách bảo mật</Link>
            <span className="text-slate-700">·</span>
            <Link to="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Về chúng tôi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
