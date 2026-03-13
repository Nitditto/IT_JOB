import { useEffect, useReducer } from 'react'
import { validate, validateEmail, validateEmpty, validatePassword } from '../../../../utils/validateForms';
import { formReducer, handleFieldChange } from '../../../../utils/formUtils';
import api from '../../../../utils/api';
export default function RegisterPage() {

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
    const formSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let emailChecker = validate(
            data.email, 
            [
                validateEmpty("Vui lòng nhập email của bạn!"), 
                validateEmail
            ]
        );
        let passwordChecker = validate(
            data.password,
            [
                validateEmpty("Vui lòng nhập mật khẩu của bạn!"),
                validatePassword
            ]
        )
        let nameChecker = validate(
            data.name,
            [
                validateEmpty("Vui lòng nhập tên của bạn!")
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
        console.log(data)
            try {
                await api.post("/auth/register/company", {
                    ...data
                })
                dispatch({type: "SUBMIT_SUCCESS", payload: "Đăng kí thành công!"})
            } catch (error: any) {
                dispatch({
                    type: "SUBMIT_FAILURE", 
                    payload: error.response?.data || "Có lỗi đã xảy ra. Vui lòng thử lại!"})
                }
            }

    useEffect(() => {
        document.title = 'Cấp tài khoản công ty'
    }, [])

    return (
        <div className="p-4 md:p-8 h-full bg-slate-50 min-h-screen flex flex-col items-center justify-start pt-12">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-xl font-bold text-slate-900 text-center">
                        Cấp Tài Khoản Công Ty
                    </h1>
                    <p className="text-sm text-slate-500 text-center mt-1">Tạo quyền truy cập hệ thống tuyển dụng cho đối tác mới</p>
                </div>
                <div className="p-8">
                    <form
                        onSubmit={formSubmission}
                        className="flex flex-col gap-5"
                    >
                        <div>
                            <label
                                htmlFor="name"
                                className="block mb-1.5 text-sm font-semibold text-slate-700 required"
                            >
                                Tên công ty
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={handleFieldChange(dispatch)}
                                className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                                placeholder="Nhập tên đối tác công ty..."
                            />
                            {error.name && <div className="text-red-500 text-xs font-medium mt-1.5">{error.name}</div>}
                        </div>
                        <div>
                            <label
                                htmlFor="email"
                                className="block mb-1.5 text-sm font-semibold text-slate-700 required"
                            >
                                Địa chỉ Email
                            </label>
                            <input
                                type="text"
                                name="email"
                                value={data.email}
                                onChange={handleFieldChange(dispatch)}
                                className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                                placeholder="name@company.com"
                            />
                            {error.email && <div className="text-red-500 text-xs font-medium mt-1.5">{error.email}</div>}
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block mb-1.5 text-sm font-semibold text-slate-700 required"
                            >
                                Mật khẩu cấp phát
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={handleFieldChange(dispatch)}
                                className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                                placeholder="••••••••"
                            />
                            {error.password && <div className="text-red-500 text-xs font-medium mt-1.5">{error.password}</div>}
                        </div>

                        {status.reason && (
                           <div className={`text-sm font-medium p-3 rounded-lg ${status.isError ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                             {status.reason}
                           </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="mt-2 h-11 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[15px] shadow-sm transition-colors disabled:opacity-70 flex justify-center items-center"
                        >
                            {isLoading ? "Đang xử lý..." : "Xác nhận tạo tài khoản"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
