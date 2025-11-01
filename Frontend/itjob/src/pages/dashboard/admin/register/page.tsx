import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { validateEmailChecker, validatePasswordChecker, validateNameChecker } from '../../../../utils/validateForms';
import axios from 'axios';
export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const formSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        let emailChecker = validateEmailChecker(email);
        let passwordChecker = validatePasswordChecker(password);
        let nameChecker = validateNameChecker(name);
        setEmailError(emailChecker.reason);
        setPasswordError(passwordChecker.reason);
        setNameError(nameChecker.reason);
        if (emailChecker.status && passwordChecker.status && nameChecker.status) {
            try {
                await axios.post(`${BACKEND_URL}/auth/register`, {
                    name: name,
                    email: email,
                    password: password,
                    role: "ROLE_COMPANY"
                })
            } catch (error: any) {
                if (error.response && error.response.data) {
                    setError(error.response.data);
                } else {
                    setError("Có lỗi đã xảy ra. Vui lòng thử lại!")
                }
            }
        }
    }

    useEffect(() => {
        document.title = 'Đăng ký'
    }, [])
    return (
        <>
            <div className="py-[60px]">
                <div className="container">
                    <div className="mx-auto max-w-[602px] rounded-[8px] border border-[#DEDEDE] px-[20px] py-[50px]">
                        <h1 className="mb-[20px] text-center text-[20px] font-bold text-black">
                            Đăng ký 
                        </h1>
                        <form
                            onSubmit={formSubmission}
                            className="grid grid-cols-1 gap-x-[20px] gap-y-[15px]"
                        >
                            <div className="">
                                <label
                                    htmlFor="fullName"
                                    aria-required
                                    className="mb-[5px] text-[14px] font-[500] text-black required"
                                >
                                    Họ tên
                                </label>
                                <input
                                    type="text"
                                    onChange={e=>setName(e.target.value)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                <div className="text-red-400">{nameError}</div>
                            </div>
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
                                    onChange={e=>setEmail(e.target.value)}
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
                                    onChange={e=>setPassword(e.target.value)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                <div className="text-red-400">{passwordError}</div>
                            </div>
                            <div className="">
                                <button type="submit" className="h-[48px] w-full cursor-pointer rounded-[4px] bg-[#0088FF] px-[20px] text-[16px] font-bold text-white">
                                    Đăng ký
                                </button>
                                <div className="text-red-400">{error}</div>
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
