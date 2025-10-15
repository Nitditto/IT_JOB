import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { setupRegisterValidation } from '../../utils/validateForms';
export default function RegisterPage() {
    useEffect(() => {
        document.title = 'Đăng ký'
    }, [])
    useEffect(() => {
        setupRegisterValidation('#register-form');
    }, []);
    return (
        <>
            <div className="py-[60px]">
                <div className="container">
                    <div className="mx-auto max-w-[602px] rounded-[8px] border border-[#DEDEDE] px-[20px] py-[50px]">
                        <h1 className="mb-[20px] text-center text-[20px] font-bold text-black">
                            Đăng ký 
                        </h1>
                        <form id='register-form'
                            action=""
                            className="grid grid-cols-1 gap-x-[20px] gap-y-[15px]"
                        >
                            <div className="">
                                <label
                                    htmlFor="fullName"
                                    className="mb-[5px] text-[14px] font-[500] text-black"
                                >
                                    Họ tên *
                                </label>
                                <input
                                    type="text"
                                    name=""
                                    id="fullName"
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                            </div>
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
                                    Đăng ký
                                </button>
                            </div>
                            <div className="flex items-center gap-1">
                                <p className="">Bạn đã có tài khoản?</p>
                                <Link
                                    to={`/login`}
                                    className="cursor-pointer text-[16px] text-[#0088FF]"
                                >
                                    Đăng nhập
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
