import React from 'react'
import { Link } from 'react-router';
import { HeaderMenu } from './HeaderMenu';
import HeaderHoverItem from './HeaderHoverItem';
import HeaderItem from './HeaderItem';

export const Header = () => {
  return (
    <>
      <header className="bg-[#000071] py-[15px]">
        <div className="container">
          <div className="flex justify-between items-center">
            
            <Link
              to="/"
              className="font-[800] sm:text-[28px] text-[20px] text-white"
            >
              <img src="/assets/images/logo.svg" alt="" className="" />
            </Link>

            <nav>
              <ul className="flex gap-x-[30px] flex-wrap">
                
                <HeaderHoverItem toHref='/search' linkText='Việc Làm IT'>
                  <HeaderMenu>
                    <HeaderHoverItem item toHref='/search' linkText='Việc làm IT theo kỹ năng'>
                      <HeaderMenu item>
                        <HeaderItem toHref='/search?query=reactjs' linkText='ReactJS' />
                        <HeaderItem toHref='/search?query=nodejs' linkText='NodeJS' />
                        <HeaderItem toHref='/search?query=js' linkText='Javascript' />
                        <HeaderItem toHref='/search?query=html' linkText='HTML5' />
                        <HeaderItem toHref='/search?query=css' linkText='CSS3' />
                      </HeaderMenu>
                    </HeaderHoverItem>
                    <HeaderItem toHref='/search?company=LG' linkText='Việc làm IT theo công ty' />
                    <HeaderItem toHref='/search?city=HN' linkText='Việc làm IT theo thành phố' />
                  </HeaderMenu>
                </HeaderHoverItem>
                
                <HeaderHoverItem toHref='/top' linkText='Top Công Ty IT'>
                <HeaderMenu>
                  <HeaderItem toHref='/company?id=1' linkText='FPT Software' />
                  <HeaderItem toHref='/company?id=2' linkText='Techcombank' />
                  <HeaderItem toHref='/company?id=3' linkText='MB Bank' />
                </HeaderMenu>
                </HeaderHoverItem>
                
              </ul>
            </nav>

            <div className="font-[600] text-[16px] text-white inline-flex gap-x-[5px] relative">
              <HeaderHoverItem toHref='/profile' linkText='LG Eletronics'>
                <HeaderMenu>
                  <HeaderItem toHref='/company' linkText="Thông tin công ty"/>
                  <HeaderItem toHref='/dashboard/company/job' linkText="Quản lý công việc"/>
                  <HeaderItem toHref='/dashboard/company/cv' linkText="Quản lý CV"/>
                  <HeaderItem toHref='/logout' linkText="Đăng xuất"/>
                </HeaderMenu>
              </HeaderHoverItem>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
