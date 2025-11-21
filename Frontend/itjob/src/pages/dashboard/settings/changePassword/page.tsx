import { useEffect, useReducer, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
export default function chnagePassword() {
 
    return (
        <>
            <div className="py-[60px]">
                <div className="container">
                    <div className="mx-auto max-w-[602px] rounded-[8px] border border-[#DEDEDE] px-[20px] py-[50px]">
                        <h1 className="mb-[20px] text-center text-[20px] font-bold text-black">
                            Đổi mật khẩu
                        </h1>
                        <form
                            onSubmit={formSubmission}
                            className="grid grid-cols-1 gap-x-[20px] gap-y-[15px]"
                        >
                            <div className="">
                                <label
                                    htmlFor="password"
                                    aria-required
                                    className="mb-[5px] text-[14px] font-[500] text-black required"
                                >
                                    Mật khẩu khới
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    onChange={handleFieldChange(dispatch)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                {error.password && <div className="text-red-400">{error.password}</div>}
                            </div>
                            <div className="">
                                <label
                                    htmlFor="password"
                                    aria-required
                                    className="mb-[5px] text-[14px] font-[500] text-black required"
                                >
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    onChange={handleFieldChange(dispatch)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                {error.password && <div className="text-red-400">{error.password}</div>}
                            </div>
                            <div className="">
                                <button type="submit" disabled={isLoading} className="h-[48px] w-full cursor-pointer rounded-[4px] bg-[#0088FF] disabled:bg-[#0088ff]/50 px-[20px] text-[16px] font-bold text-white">
                                    {isLoading ? "Đang xử lý..." : "Đăng ký"}
                                </button>
                                <div className={status.isError ? "text-red-400" : "text-green-400"}>{status.reason}</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <p className="">Quay lại</p>
                                <Link
                                    to={`/login`}
                                    className="cursor-pointer text-[16px] text-[#0088FF]"
                                >
                                    Thay đổi
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
