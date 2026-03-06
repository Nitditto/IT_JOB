import { useEffect, useReducer } from 'react'
import { Link, useNavigate } from 'react-router'
import { validateEmpty, validatePassword, validate, validateEmail } from '../../utils/validateForms';
import axios from 'axios';
import { formReducer, handleFieldChange } from '../../utils/formUtils';

export default function CompanyRegisterPage() {
    const initialState = {
        data: {
            name: "",
            email: "",
            password: ""
        },
        error: {
            name: "",
            email: "",
            password: ""
        },
        isLoading: false,
        status: {
            isError: false,
            reason: ""
        }
    }
    const [state, dispatch] = useReducer(formReducer(initialState), initialState)
    const {data, error, isLoading, status} = state;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

    const formSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let emailChecker = validate(
            data.email, 
            [
                validateEmpty("Vui lòng nhập email công ty!"), 
                validateEmail
            ]
        );
        let passwordChecker = validate(
            data.password,
            [
                validateEmpty("Vui lòng nhập mật khẩu!"),
                validatePassword
            ]
        )
        let nameChecker = validate(
            data.name,
            [
                validateEmpty("Vui lòng nhập tên công ty!")
            ]
        )
        
        if (!emailChecker.status || !passwordChecker.status || !nameChecker.status) {
            // Dispatch error
            dispatch({
                type: "VALIDATE_FAILURE",
                payload: {
                    email: emailChecker.reason,
                    password: passwordChecker.reason,
                    name: nameChecker.reason
                }
            });
            return;
        }

        // If there's no error, buffering load and call API
        dispatch({type: "SUBMIT_START"});
        try {
            await axios.post(`${BACKEND_URL}/auth/register`, {
                ...data,
                role: "ROLE_COMPANY"
            })
            dispatch({type: "SUBMIT_SUCCESS", payload: "Đăng ký tài khoản Nhà Tuyển Dụng thành công!"})
            setTimeout(() => {
                navigate('/login')
            }, 1000);
        } catch (error: any) {
            dispatch({
                type: "SUBMIT_FAILURE", 
                payload: error.response?.data || "Có lỗi đã xảy ra. Vui lòng thử lại!"})
        }
    }

    useEffect(() => {
        document.title = 'Đăng ký Nhà Tuyển Dụng'
    }, [])

    return (
        <div className="py-[60px] bg-slate-50 min-h-[calc(100vh-100px)]">
            <div className="container">
                <div className="mx-auto max-w-[602px] rounded-[16px] bg-white shadow-xl px-[40px] py-[50px]">
                    <div className="text-center mb-[40px]">
                        <h1 className="text-[28px] font-bold text-slate-900 mb-2">
                            Đăng ký Nhà Tuyển Dụng
                        </h1>
                        <p className="text-slate-500">
                            Tìm kiếm những ứng viên tài năng nhất cho doanh nghiệp của bạn
                        </p>
                    </div>
                    
                    <form
                        onSubmit={formSubmission}
                        className="grid grid-cols-1 gap-y-[20px]"
                    >
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-[8px] block text-[15px] font-[600] text-slate-700 required"
                            >
                                Tên công ty đại diện
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={handleFieldChange(dispatch)}
                                className="h-[50px] w-full rounded-[8px] border border-slate-300 px-[20px] text-[15px] text-slate-900 focus:outline-none focus:border-[#00b14f] focus:ring-1 focus:ring-[#00b14f] transition-all"
                                placeholder="Nhập tên nhà tuyển dụng..."
                            />
                            {error.name && <div className="text-red-500 text-[13px] mt-1">{error.name}</div>}
                        </div>
                        
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-[8px] block text-[15px] font-[600] text-slate-700 required"
                            >
                                Email công việc
                            </label>
                            <input
                                type="text"
                                name="email"
                                value={data.email}
                                onChange={handleFieldChange(dispatch)}
                                className="h-[50px] w-full rounded-[8px] border border-slate-300 px-[20px] text-[15px] text-slate-900 focus:outline-none focus:border-[#00b14f] focus:ring-1 focus:ring-[#00b14f] transition-all"
                                placeholder="Email liên hệ tuyển dụng..."
                            />
                            {error.email && <div className="text-red-500 text-[13px] mt-1">{error.email}</div>}
                        </div>
                        
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-[8px] block text-[15px] font-[600] text-slate-700 required"
                            >
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={handleFieldChange(dispatch)}
                                className="h-[50px] w-full rounded-[8px] border border-slate-300 px-[20px] text-[15px] text-slate-900 focus:outline-none focus:border-[#00b14f] focus:ring-1 focus:ring-[#00b14f] transition-all"
                                placeholder="Tạo mật khẩu an toàn..."
                            />
                            {error.password && <div className="text-red-500 text-[13px] mt-1">{error.password}</div>}
                        </div>
                        
                        <div className="mt-4">
                            <button type="submit" disabled={isLoading} className="h-[52px] w-full cursor-pointer rounded-[8px] bg-[#00b14f] hover:bg-[#00b14f]/90 transition-colors disabled:bg-slate-300 px-[20px] text-[16px] font-bold text-white shadow-md">
                                {isLoading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
                            </button>
                            <div className={`mt-3 text-center text-[14px] ${status.isError ? "text-red-500" : "text-[#00b14f] font-medium"}`}>
                                {status.reason}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 mt-2 pt-6 border-t border-slate-100">
                            <p className="text-slate-600">Đã có tài khoản nhà tuyển dụng?</p>
                            <Link
                                to={`/login`}
                                className="cursor-pointer text-[15px] font-bold text-[#00b14f] hover:underline"
                            >
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
