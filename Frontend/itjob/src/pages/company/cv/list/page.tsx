import { Link } from 'react-router'
import {
    FaBriefcase,
    FaCircleCheck,
    FaEnvelope,
    FaEye,
    FaPhone,
    FaUserTie,
} from 'react-icons/fa6'
import { useEffect } from 'react'
import { Pagination } from '../../../../components/pagination/Pagination'

export default function CompanyManageCVListPage() {
    useEffect(() => {
        document.title = 'Quản lý CV'
    }, [])
    return (
        <>
            <div className="mx-8 w-[90%] py-[60px]">
                <div className="mb-[20px] flex flex-wrap items-center justify-between gap-[20px]">
                    <h1 className="text-[28px] font-bold text-[#121212]">
                        Quản lý CV
                    </h1>
                </div>
                <div className="grid grid-cols-1 gap-[50px] sm:grid-cols-2 lg:grid-cols-3">
                    <div
                        className="w-[360px] relative flex flex-col truncate rounded-[8px] border border-[#DEDEDE]"
                        style={{
                            background:
                                'linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)',
                        }}
                    >
                        <img
                            src="/assets/images/card-bg.svg"
                            alt=""
                            className="absolute top-[0px] left-[0px] h-auto w-[100%]"
                        />
                        <h3 className="mx-[16px] mt-[20px] line-clamp-2 flex-1 text-center text-[18px] font-[700] whitespace-normal text-[#121212]">
                            Frontend Engineer (ReactJS)
                        </h3>
                        <div className="mt-[12px] text-center text-[14px] font-[400] text-black">
                            Ứng viên:{' '}
                            <span className="font-[700]">Lê Văn A</span>
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaEnvelope className="" /> levana@gmail.com
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaPhone className="" /> 0123456789
                        </div>
                        <div className="mt-[12px] text-center text-[16px] font-[600] text-[#0088FF]">
                            1.000$ - 1.500$
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaUserTie className="text-[16px]" /> Fresher
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaBriefcase className="text-[16px]" /> Tại văn
                            phòng
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#FF0000]">
                            <FaEye className="text-[16px]" /> Chưa xem
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaCircleCheck className="text-[16px]" /> Chưa duyệt
                        </div>
                        <div className="mx-[10px] mt-[12px] mb-[20px] flex flex-wrap items-center justify-center gap-[8px]">
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#0088FF] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Xem
                            </Link>
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#9FDB7C] px-[20px] py-[8px] text-[14px] font-[400] text-black"
                            >
                                Duyệt
                            </Link>
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#FF5100] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Từ chối
                            </Link>
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#FF0000] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Xóa
                            </Link>
                        </div>
                    </div>
                    <div
                        className="w-[360px] relative flex flex-col truncate rounded-[8px] border border-[#DEDEDE]"
                        style={{
                            background:
                                'linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)',
                        }}
                    >
                        <img
                            src="/assets/images/card-bg.svg"
                            alt=""
                            className="absolute top-[0px] left-[0px] h-auto w-[100%]"
                        />
                        <h3 className="mx-[16px] mt-[20px] line-clamp-2 flex-1 text-center text-[18px] font-[700] whitespace-normal text-[#121212]">
                            Frontend Engineer (ReactJS)
                        </h3>
                        <div className="mt-[12px] text-center text-[14px] font-[400] text-black">
                            Ứng viên:{' '}
                            <span className="font-[700]">Lê Văn A</span>
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaEnvelope className="" /> levana@gmail.com
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaPhone className="" /> 0123456789
                        </div>
                        <div className="mt-[12px] text-center text-[16px] font-[600] text-[#0088FF]">
                            1.000$ - 1.500$
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaUserTie className="text-[16px]" /> Fresher
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaBriefcase className="text-[16px]" /> Tại văn
                            phòng
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaEye className="text-[16px]" /> Đã xem
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#47BE02]">
                            <FaCircleCheck className="text-[16px]" /> Đã duyệt
                        </div>
                        <div className="mx-[10px] mt-[12px] mb-[20px] flex flex-wrap items-center justify-center gap-[8px]">
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#0088FF] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Xem
                            </Link>
                            {/* <Link to={"#"} className=" bg-[#9FDB7C] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px]">
                  Duyệt
                </Link> */}
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#FF5100] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Từ chối
                            </Link>
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#FF0000] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Xóa
                            </Link>
                        </div>
                    </div>
                    <div
                        className="w-[360px] relative flex flex-col truncate rounded-[8px] border border-[#DEDEDE]"
                        style={{
                            background:
                                'linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)',
                        }}
                    >
                        <img
                            src="/assets/images/card-bg.svg"
                            alt=""
                            className="absolute top-[0px] left-[0px] h-auto w-[100%]"
                        />
                        <h3 className="mx-[16px] mt-[20px] line-clamp-2 flex-1 text-center text-[18px] font-[700] whitespace-normal text-[#121212]">
                            Frontend Engineer (ReactJS)
                        </h3>
                        <div className="mt-[12px] text-center text-[14px] font-[400] text-black">
                            Ứng viên:{' '}
                            <span className="font-[700]">Lê Văn A</span>
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaEnvelope className="" /> levana@gmail.com
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaPhone className="" /> 0123456789
                        </div>
                        <div className="mt-[12px] text-center text-[16px] font-[600] text-[#0088FF]">
                            1.000$ - 1.500$
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaUserTie className="text-[16px]" /> Fresher
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaBriefcase className="text-[16px]" /> Tại văn
                            phòng
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#121212]">
                            <FaEye className="text-[16px]" /> Đã xem
                        </div>
                        <div className="mt-[6px] flex items-center justify-center gap-[8px] text-[14px] font-[400] text-[#FF5100]">
                            <FaCircleCheck className="text-[16px]" /> Từ chối
                        </div>
                        <div className="mx-[10px] mt-[12px] mb-[20px] flex flex-wrap items-center justify-center gap-[8px]">
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#0088FF] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Xem
                            </Link>
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#9FDB7C] px-[20px] py-[8px] text-[14px] font-[400] text-black"
                            >
                                Duyệt
                            </Link>
                            <Link
                                to={'#'}
                                className="inline-block rounded-[4px] bg-[#FF0000] px-[20px] py-[8px] text-[14px] font-[400] text-white"
                            >
                                Xóa
                            </Link>
                        </div>
                    </div>
                </div>

                <Pagination />
            </div>
        </>
    )
}
