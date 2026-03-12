import { useEffect, useReducer, useState } from 'react'
import { Link, useSearchParams } from "react-router"
import { validate, validateEmail, validateEmpty } from '../../utils/validateForms';
import axios from 'axios';
import { formReducer, handleFieldChange } from '../../utils/formUtils';
import { motion } from 'framer-motion';
import { User, Building2, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '@/utils/api';

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
        status: { isError: false, reason: "" }
    }
    const [state, dispatch] = useReducer(formReducer(initialState), initialState);
    const { data, error, isLoading, status } = state;

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
            [validateEmpty("Hãy nhập email của bạn!"), validateEmail]
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
        dispatch({ type: "SUBMIT_START" });

        try {
            let response = await axios.post(`${BACKEND_URL}/auth/login`, {
                ...data
            })
            const { token } = response.data;

            if (token) {
                localStorage.setItem('token', token);
                dispatch({ type: "SUBMIT_SUCCESS", payload: "Đăng nhập thành công!" })
                window.location.reload();
                window.location.href = "/"
            }
        } catch (error: any) {
            dispatch({ type: "SUBMIT_FAILURE", payload: error.response?.data || "Có lỗi đã xảy ra. Vui lòng thử lại!" })
        }
    }
    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                    {/* Gradient Header */}
                    <div className="px-8 pt-8 pb-6 text-center"
                        style={{ background: 'linear-gradient(135deg, rgba(67,56,202,0.05) 0%, rgba(109,40,217,0.05) 100%)' }}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                            {isUser ? <User size={26} className="text-white" /> : <Building2 size={26} className="text-white" />}
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isUser ? "Đăng nhập" : "Đăng nhập Nhà Tuyển Dụng"}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {isUser ? "Chào mừng bạn quay lại IT.JOB" : "Quản lý tuyển dụng hiệu quả"}
                        </p>
                    </div>

                    {/* Form */}
                    <div className="px-8 pb-8 pt-2">
                        <form id='login-form' onSubmit={formSubmission} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 required">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        name='email'
                                        value={data.email}
                                        onChange={handleFieldChange(dispatch)}
                                        placeholder="your@email.com"
                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                {error.email && <div className="text-red-500 text-xs mt-1.5 font-medium">{error.email}</div>}
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 required">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        name='password'
                                        value={data.password}
                                        onChange={handleFieldChange(dispatch)}
                                        placeholder="••••••••"
                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                {error.password && <div className="text-red-500 text-xs mt-1.5 font-medium">{error.password}</div>}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Đăng nhập <ArrowRight size={16} /></>
                                )}
                            </button>

                            {status.reason && (
                                <div className={`text-sm text-center py-2 px-3 rounded-lg font-medium ${status.isError
                                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                    {status.reason}
                                </div>
                            )}
                        </form>

                        {/* Links */}
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                {isUser ? (
                                    <button onClick={() => { setIsUser(false); setSearchParams({ type: "company" }); }}
                                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                        Dành cho nhà tuyển dụng
                                    </button>
                                ) : (
                                    <Link to="/login" onClick={() => setIsUser(true)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                        Dành cho ứng viên
                                    </Link>
                                )}
                                <Link to="forgotpassword" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            {isUser && (
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Chưa có tài khoản? </span>
                                    <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                                        Đăng ký ngay
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
