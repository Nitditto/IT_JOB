import { useEffect, useState } from 'react'
import {Link, useSearchParams} from "react-router"
export default function LoginPage() {
    const [isUser,setIsUser]=useState(true)
    const [searchParams,setSearchParams]=useSearchParams();
    useEffect(() => {
        document.title = 'Đăng nhập';
        let userType = searchParams.get("type")
        setIsUser(userType == "company" ? false : true)
    }, [])
    return (
        <>
            <div className="py-[60px]">
                <div className="container">
                    <div className="mx-auto max-w-[602px] rounded-[8px] border border-[#DEDEDE] px-[20px] py-[50px]">
                        <h1 className="mb-[20px] text-center text-[20px] font-bold text-black">
                            {isUser ? "Đăng nhập (Ứng viên)" : "Đăng nhập (Nhà tuyển dụng)"}
                        </h1>
                        <form
                            action=""
                            className="grid grid-cols-1 gap-x-[20px] gap-y-[15px]"
                        >
                            <div className="">
                                <label
                                    htmlFor="email"
                                    className="mb-[5px] text-[14px] font-[500] text-black"
                                >
                                    Email *
                                </label>
                                <input
                                    type="text"
                                    name=""
                                    id="email"
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                            </div>
                            <div className="">
                                <label
                                    htmlFor="password"
                                    className="mb-[5px] text-[14px] font-[500] text-black"
                                >
                                    Mật khẩu *
                                </label>
                                <input
                                    type="password"
                                    name=""
                                    id="password"
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                            </div>
                            <div className="">
                                <button className="h-[48px] w-full cursor-pointer rounded-[4px] bg-[#0088FF] px-[20px] text-[16px] font-bold text-white">
                                    Đăng nhập
                                </button>
                            </div>
                            <div className="flex items-center justify-between w-full">
                              {isUser ? <Link to={"/login?type=company"} className="w-1/2 cursor-pointer text-[#0088FF] text-[16px]" onClick={()=>{
                                setIsUser(false);
                                setSearchParams({type: "company"})
                                }}>Dành cho nhà tuyển dụng</Link> : <Link to={"/login"} className="w-1/2 cursor-pointer text-[#0088FF] text-[16px]" onClick={()=>{
                                setIsUser(true);
                                }}>Dành cho ứng viên</Link>}
                              <Link to={"forgotpassword"} className='w-1/2 cursor-pointer text-[#0088FF] text-[16px] text-right'>Quên mật khẩu?</Link>
                            </div>
                            {isUser ? <div className='flex items-center gap-1'>
                              <p className="">Bạn chưa có tài khoản?</p>
                              <Link to={`/register`} className='cursor-pointer text-[#0088FF] text-[16px] '>Tạo tài khoản</Link>
                            </div> : ""}
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
