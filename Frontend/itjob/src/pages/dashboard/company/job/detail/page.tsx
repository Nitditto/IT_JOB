import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
    FaArrowRightLong,
    FaBriefcase,
    FaLocationDot,
    FaUserTie,
} from 'react-icons/fa6'

export default function JobDetailPage() {
    useEffect(() => {
        document.title = 'Chi tiết công việc'
    }, [])

    const [infoJob, setInfoJob] = useState({
        nameJob: 'Front End Developer ( Javascript, ReactJS)',
        nameCompany: 'LG CNS Việt Nam',
        salary: '1.000$ - 1.500$',
        position: 'Fresher',
        workstyle: 'Tại văn phòng',
        location:
            'Tầng 15, tòa Keangnam Landmark 72, Mễ Trì, Nam Tu Liem, Ha Noi',
        tags: ['ReactJS', 'NextJS', 'Javascript'],
        description:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe voluptas necessitatibus non quod velit dolor nulla minima dolorem! Culpa soluta nihil nobis ea qui quidem saepe nostrum laboriosam aspernatur similique.',
        nameEmployee: '',
        email: '',
        phone: '',
        images: '',
    })

    const [cvFile, setCvFile] = useState(null)

    const handleFileChange = (e) => {
        // e.target.files là một danh sách, ta lấy file đầu tiên [0]
        if (e.target.files && e.target.files.length > 0) {
            setCvFile(e.target.files[0])
        }
    }
    const handleChange = (e) => {
        const { name, value } = e.target

        setInfoJob((prev) => ({
            ...prev,
            [name]: value,
        }))
    }
    // Đây là hàm 'formSubmission' của bạn
    const formSubmission = async (e) => {
        e.preventDefault() // Ngăn form reload lại trang

        // 1. Kiểm tra xem người dùng đã chọn file chưa
        if (!cvFile) {
            alert('Vui lòng chọn file CV của bạn.')
            return // Dừng hàm nếu chưa có file
        }

        // 2. Tạo một đối tượng FormData
        const formData = new FormData()

        // 3. Thêm các trường thông tin text từ state 'infoJob'
        // LƯU Ý: Tên key ('fullName', 'email') phải khớp với tên mà server của bạn mong đợi
        formData.append('fullName', infoJob.nameEmployee)
        formData.append('email', infoJob.email)
        formData.append('phone', infoJob.phone)

        // 4. Thêm file CV vào FormData
        // Key 'cvFile' là tên mà server sẽ dùng để nhận file.
        // Bạn có thể đổi tên này ('cvFile') miễn là server biết.
        formData.append('cvFile', cvFile)

        // 5. Gửi FormData lên server bằng fetch (hoặc axios)
        try {
            const response = await fetch('URL_API_UPLOAD_CUA_BAN', {
                method: 'POST',
                body: formData,
                // Khi dùng FormData, bạn KHÔNG CẦN set header 'Content-Type'.
                // Trình duyệt sẽ tự động set nó thành 'multipart/form-data'.
            })

            if (response.ok) {
                alert('Gửi CV thành công!')
                // Xóa form hoặc chuyển hướng
            } else {
                const errorData = await response.json()
                alert(
                    'Gửi CV thất bại: ' +
                        (errorData.message || response.statusText)
                )
            }
        } catch (error) {
            console.error('Lỗi khi gửi form:', error)
            alert('Lỗi kết nối, không thể gửi CV.')
        }
    }
    return (
        <>
            {/* Chi tiet cong viec  */}
            <div className="pt-[30px] pb-[60px]">
                <div className="container">
                    {/* Wrap  */}
                    <div className="flex flex-wrap gap-[20px]">
                        {/* Left  */}
                        <div className="w-full lg:w-[65%]">
                            {/* Thông tin công việc  */}
                            <div className="rounded-[8px] border border-[#DEDEDE] p-[20px]">
                                <h1 className="mb-[10px] text-[24px] font-bold text-[#121212] sm:text-[28px]">
                                    {infoJob.nameJob}
                                </h1>
                                <div className="mb-[10px] text-[16px] font-[400] text-[#414042]">
                                    {infoJob.nameCompany}
                                </div>
                                <div className="mb-[10px] text-[20px] font-[700] text-[#0088FF] sm:mb-[20px]">
                                    {infoJob.salary}
                                </div>
                                <Link
                                    to={'#'}
                                    className="mb-[20px] block rounded-[4px] bg-[#0088FF] p-[14px] text-center text-[16px] font-bold text-white"
                                >
                                    Ứng tuyển
                                </Link>
                                <div className="mb-[20px] grid grid-cols-3 gap-[8px] sm:gap-[16px]">
                                    <img
                                        src="/assets/images/demo-banner-1.jpg"
                                        alt=""
                                        className="aspect-[232/145] w-full rounded-[4px] object-cover"
                                    />
                                    <img
                                        src="/assets/images/demo-banner-2.jpg"
                                        alt=""
                                        className="aspect-[232/145] w-full rounded-[4px] object-cover"
                                    />
                                    <img
                                        src="/assets/images/demo-banner-3.jpg"
                                        alt=""
                                        className="aspect-[232/145] w-full rounded-[4px] object-cover"
                                    />
                                </div>
                                <div className="mb-[10px] flex items-center gap-[8px] text-[14px]">
                                    <FaUserTie className="text-[16px]" />{' '}
                                    {infoJob.position}
                                </div>
                                <div className="mb-[10px] flex items-center gap-[8px] text-[14px]">
                                    <FaBriefcase className="text-[16px]" /> Tại
                                    {infoJob.workstyle}
                                </div>
                                <div className="mb-[10px] flex items-center gap-[8px] text-[14px]">
                                    <FaLocationDot className="text-[16px]" />{' '}
                                    {infoJob.location}
                                </div>
                                <div className="flex flex-wrap gap-[8px]">
                                    {infoJob.tags.map((item, index) => (
                                        <div
                                            key={index}
                                            className="rounded-[20px] border border-[#DEDEDE] px-[16px] py-[6px] text-[12px] font-[400] text-[#414042]"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Mo ta chi tiet  */}
                            <div className="mt-[20px] rounded-[8px] border border-[#DEDEDE] p-[20px]">
                                {infoJob.description}
                            </div>
                            {/* Form ung tuyen  */}
                            <div className="mt-[20px] rounded-[8px] border border-[#DEDEDE] p-[20px]">
                                <h2 className="mb-[20px] text-[20px] font-bold text-black">
                                    Ứng tuyển ngay
                                </h2>
                                <form
                                    onSubmit={formSubmission}
                                    action=""
                                    className="flex flex-col gap-[15px]"
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
                                            name="fullName"
                                            onChange={handleChange}
                                            value={infoJob.nameEmployee}
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
                                            type="email"
                                            name="email"
                                            onChange={handleChange}
                                            value={infoJob.email}
                                            id="email"
                                            className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                        />
                                    </div>
                                    <div className="">
                                        <label
                                            htmlFor="phone"
                                            className="mb-[5px] text-[14px] font-[500] text-black"
                                        >
                                            Số điện thoại *
                                        </label>
                                        <input
                                            type="number"
                                            name="phone"
                                            onChange={handleChange}
                                            value={infoJob.phone}
                                            id="phone"
                                            className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black"
                                        />
                                    </div>
                                    <div className="">
                                        <label
                                            htmlFor="fildCV"
                                            className="mb-[5px] text-[14px] font-[500] text-black"
                                        >
                                            File CV dạng PDF *
                                        </label>
                                        <input
                                            type="file"
                                            name="images"
                                            onChange={handleFileChange}
                                            accept=".pdf"
                                            id="fildCV"
                                            className="h-[46px] w-full rounded-[4px] border border-[#DEDEDE] px-[20px] text-[14px] font-[500] text-black file:py-[12px]"
                                        />
                                    </div>
                                    <button className="h-[48px] w-full cursor-pointer rounded-[4px] bg-[#0088FF] text-[16px] font-bold text-white" type='submit'>
                                        Gửi CV ứng tuyển
                                    </button>
                                </form>
                            </div>
                        </div>
                        {/* Right  */}
                        <div className="flex-1">
                            {/* Thong tin cong ty  */}
                            <div className="rounded-[8px] border border-[#DEDEDE] p-[20px]">
                                <div className="flex gap-[12px]">
                                    <div className="aspect-square w-[100px] truncate rounded-[4px]">
                                        <img
                                            src="/assets/images/demo-logo-company-1.jpg"
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-[10px] text-[18px] font-bold text-[#121212]">
                                            LG CNS Việt Nam
                                        </div>
                                        <Link
                                            to={'../../infoCompany/page.tsx'}
                                            className="flex items-center gap-[8px] text-[16px] font-[400] text-[#0088FF]"
                                        >
                                            Xem công ty{' '}
                                            <FaArrowRightLong className="text-[16px]" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="mt-[20px] flex flex-col gap-[10px]">
                                    <div className="flex items-center justify-between gap-[10px]">
                                        <div className="text-[16px] font-[400] text-[#A6A6A6]">
                                            Mô hình công ty
                                        </div>
                                        <div className="text-right text-[16px] font-[400] text-[#121212]">
                                            Sản phẩm
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-[10px]">
                                        <div className="text-[16px] font-[400] text-[#A6A6A6]">
                                            Quy mô công ty
                                        </div>
                                        <div className="text-right text-[16px] font-[400] text-[#121212]">
                                            151 - 300 nhân viên
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-[10px]">
                                        <div className="text-[16px] font-[400] text-[#A6A6A6]">
                                            Thời gian làm việc
                                        </div>
                                        <div className="text-right text-[16px] font-[400] text-[#121212]">
                                            Thứ 2 - Thứ 6
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-[10px]">
                                        <div className="text-[16px] font-[400] text-[#A6A6A6]">
                                            Làm việc ngoài giờ
                                        </div>
                                        <div className="text-right text-[16px] font-[400] text-[#121212]">
                                            Không có OT
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
