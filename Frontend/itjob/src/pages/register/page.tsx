import { useEffect, useReducer, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { validateEmpty, validatePassword, validate, validateEmail } from '../../utils/validateForms';
import axios from 'axios';
import { formReducer } from '../../utils/formUtils';
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
    const handleFieldChange = (e: any) => {
        dispatch({
            type: "CHANGE_FIELD",
            field: e.target.name,
            value: e.target.value
        })
    }
    const [state, dispatch] = useReducer(formReducer(initialState), initialState)
    const {data, error, isLoading, status} = state;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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
            try {
                await axios.post(`${BACKEND_URL}/auth/register`, {
                    ...data,
                    role: "ROLE_USER"
                })
                dispatch({type: "SUBMIT_SUCCESS", payload: "Đăng kí thành công!"})
            } catch (error: any) {
                dispatch({
                    type: "SUBMIT_FAILURE", 
                    payload: error.response?.data || "Có lỗi đã xảy ra. Vui lòng thử lại!"})
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
                                    htmlFor="name"
                                    aria-required
                                    className="mb-[5px] text-[14px] font-[500] text-black required"
                                >
                                    Họ tên
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    onChange={handleFieldChange}
                                    className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                />
                                {error.name && <div className="text-red-400">{error.name}</div>}
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
                                    name="email"
                                    value={data.email}
                                    onChange={handleFieldChange}
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
                                    name="password"
                                    value={data.password}
                                    onChange={handleFieldChange}
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
