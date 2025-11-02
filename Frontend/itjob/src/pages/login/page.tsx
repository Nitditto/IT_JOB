import { useEffect, useReducer, useState } from 'react'
import { Link, useSearchParams } from "react-router"
import { validate, validateEmail, validateEmpty } from '../../utils/validateForms';
import axios from 'axios';
import { formReducer, handleFieldChange } from '../../utils/formUtils';

export default function LoginPage() {
    const initialState = {
        data: {
            email: "",
            password: ""
        },
        error: {
            email: "",
            password: ""
        },
        isLoading: false,
        status: {isError: false, reason: ""}
    }
    const [state, dispatch] = useReducer(formReducer(initialState), initialState);
    const {data, error, isLoading, status} = state;

    const [isUser, setIsUser] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    useEffect(() => {
        document.title = 'Đăng nhập';
        let userType = searchParams.get("type");
        setIsUser(userType == "company" ? false : true);
    }, [])

    const formSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let emailChecker = validate(
            data.email,
            [validateEmpty("Hãy nhập email của bạn!"),validateEmail]
        )
        let passwordChecker = validate(
            data.password,
            [validateEmpty("Hãy nhập mật khẩu của bạn!")]
        )
        if (!emailChecker.status || !passwordChecker.status) {
            dispatch({
                type: "VALIDATE_FAILURE",
                payload: {
                    email: emailChecker.reason,
                    password: passwordChecker.reason
                }
            })
        }
        dispatch({type: "SUBMIT_START"});

        try {
            let response = await axios.post(`${BACKEND_URL}/auth/login`, {
                ...data
            })
            const { token } = response.data;

            if (token) {
                // Lưu token vào localStorage
                localStorage.setItem('token', token);
                
                // Bạn không cần set header thủ công ở đây nữa
                // Interceptor sẽ tự động làm việc đó cho các request tiếp theo
                
                dispatch({type: "SUBMIT_SUCCESS", payload: "Đăng nhập thành công!"})
                // Điều hướng người dùng đến trang dashboard hoặc trang chủ
                // window.location.href = '/dashboard
                window.location.reload();
                window.location.href = "/"
            }
        } catch (error: any) {
            dispatch({type: "SUBMIT_FAILURE", payload: error.response?.data || "Có lỗi đã xảy ra. Vui lòng thử lại!"})
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
                                    name='email'
                                    value={data.email}
                                    onChange={handleFieldChange(dispatch)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                {error.email && <div className="text-red-400">{error.email}</div>}
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
                                    name='password'
                                    value={data.password}
                                    onChange={handleFieldChange(dispatch)}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                {error.password && <div className="text-red-400">{error.password}</div>}
                            </div>
                            <div className="">
                                <button type="submit" disabled={isLoading} className="h-[48px] w-full cursor-pointer rounded-[4px] bg-[#0088FF] disabled:bg-[#0088ff]/50 px-[20px] text-[16px] font-bold text-white">
                                    {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                                </button>
                                <div className={status.isError ? "text-red-400" : "text-green-400"}>{status.reason}</div>
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
