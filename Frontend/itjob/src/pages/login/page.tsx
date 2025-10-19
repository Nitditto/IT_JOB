import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from "react-router"
import { validateEmailChecker, validatePasswordChecker } from '../../utils/validateForms';
import axios from 'axios';

export default function LoginPage() {
    const [isUser, setIsUser] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams();
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    useEffect(() => {
        document.title = 'Đăng nhập';
        let userType = searchParams.get("type");
        setIsUser(userType == "company" ? false : true);
    }, [])

    const formSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        let emailChecker = validateEmailChecker(email);
        let passwordChecker = validatePasswordChecker(password);
        setEmailError(emailChecker.reason);
        setPasswordError(passwordChecker.reason);
        if (emailChecker.status && passwordChecker.status) {
            try {
                await axios.post(`${BACKEND_URL}/auth/login`, {
                    email: email,
                    password: password
                })
                navigate("/");
            } catch (error: any) {
                if (error.response && error.response.data) {
                    setError(error.response.data);
                } else {
                    setError("Có lỗi đã xảy ra. Vui lòng thử lại!")
                }
            }
        }
    }
    return (
        <>
            <div className="py-[60px]">
                <div className="container">
                    <div className="mx-auto max-w-[602px] rounded-[8px] border border-[#DEDEDE] px-[20px] py-[50px]">
                        <h1 className="mb-[20px] text-center text-[20px] font-bold text-black">
                            {isUser ? "Đăng nhập (Ứng viên)" : "Đăng nhập (Nhà tuyển dụng)"}
                        </h1>
                        <form id='login-form'
                            onSubmit={formSubmission}
                            className="grid grid-cols-1 gap-x-[20px] gap-y-[15px]"
                        >
                            <div className="">
                                <label
                                    htmlFor="email"
                                    aria-required
                                    className="mb-[5px] text-[14px] font-[500] text-black required"
                                >
                                    Email
                                </label>
                                <input
                                    type="text"
                                    onChange={e => setEmail(e.target.value)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                <div className="text-red-400">{emailError}</div>
                            </div>
                            <div className="">
                                <label
                                    htmlFor="password"
                                    aria-required
                                    className="mb-[5px] text-[14px] font-[500] text-black required"
                                >
                                    Mật khẩu
                                </label>
                                <input
                                    type="password"
                                    onChange={e => setPassword(e.target.value)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                <div className="text-red-400">{passwordError}</div>
                            </div>
                            <div className="">
                                <button type="submit" className="h-[48px] w-full cursor-pointer rounded-[4px] bg-[#0088FF] px-[20px] text-[16px] font-bold text-white">
                                    Đăng nhập
                                </button>
                                <div className="text-red-400">{error}</div>
                            </div>
                            <div className="flex items-center justify-between w-full">
                                {isUser ? <Link to={"/login?type=company"} className="w-1/2 cursor-pointer text-[#0088FF] text-[16px]" onClick={() => {
                                    setIsUser(false);
                                    setSearchParams({ type: "company" })
                                }}>Dành cho nhà tuyển dụng</Link> : <Link to={"/login"} className="w-1/2 cursor-pointer text-[#0088FF] text-[16px]" onClick={() => {
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
