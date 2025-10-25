import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router';
import { HeaderMenu } from './HeaderMenu';
import HeaderHoverItem from './HeaderHoverItem';
import HeaderItem from './HeaderItem';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {

  const { isAuthenticated, user } = useAuth();
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
                  <HeaderItem to='/company?id=1' linkText='FPT Software' />
                  <HeaderItem to='/company?id=2' linkText='Techcombank' />
                  <HeaderItem to='/company?id=3' linkText='MB Bank' />
                </HeaderMenu>
                </HeaderHoverItem>
                
              </ul>
            </nav>
            <div className="font-[600] text-[16px] text-white inline-flex gap-x-[5px] relative">
              {
                isAuthenticated && !!user ? 
              <HeaderHoverItem toHref='/profile' linkText={user.name}>
                <HeaderMenu>
                  <HeaderItem to='/company' linkText="Thông tin công ty"/>
                  <HeaderItem to='/dashboard/company/job' linkText="Quản lý công việc"/>
                  <HeaderItem to='/dashboard/company/cv' linkText="Quản lý CV"/>
                  <HeaderItem to='/' onClick={()=>logoutFunction()}linkText="Đăng xuất"/>
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
