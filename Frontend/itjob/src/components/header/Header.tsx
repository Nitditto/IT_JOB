"use client"
import { Link } from "react-router";
import {  useState } from "react";
import { FaBars } from "react-icons/fa6";
import { HeaderMenu } from "./HeaderMenu";
import { HeaderAccount } from "./HeaderAccount";
export const Header = () => {

  const [showMenu,setShowMenu]=useState(false);
  const handleShowMenu =()=>{
    setShowMenu(prev=>!prev);
  }
  
  return (
    <>
      <header className="bg-[#000071] py-[15px]">
        <div className="container">
          <div className="flex justify-between items-center">
            {/* Logo  */}
            <Link
              to="#"
              className="font-[800] sm:text-[28px] text-[20px] text-white lg:flex-none flex-1"
            >
              Skibidi.ITJob
            </Link>
            {/* Menu  */}
            <HeaderMenu showMenu={showMenu}/>
            {/* Account  */}
            <HeaderAccount/>
            {/* Button  */}
            <button className="ml-[12px] lg:hidden" onClick={handleShowMenu}>
              <FaBars className="text-[20px] text-white" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
