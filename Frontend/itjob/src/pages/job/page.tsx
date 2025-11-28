import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
    FaAngleLeft,
    FaAngleRight,
    FaArrowRightLong,
    FaBriefcase,
    FaGlobe,
    FaLocationDot,
    FaUserTie,
} from 'react-icons/fa6'
import { handleFieldChange } from '../../utils/formUtils';
import axios from 'axios';
import translation from '@/utils/translation';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
const customSwiperStyles = `
  .job-detail-swiper .swiper-button-next,
  .job-detail-swiper .swiper-button-prev {
    background-color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    color: #121212;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    font-size:10px;
  }
  .job-detail-swiper .swiper-button-next:after,
  .job-detail-swiper .swiper-button-prev:after {
    display:none;
  }
.job-detail-swiper .swiper-button-next:after {
  content: '›'; 
  font-size: 14px;
}

.job-detail-swiper .swiper-button-prev:after {
  content: '‹'; 
  font-size: 14px;
}

  .job-detail-swiper .swiper-button-next:hover,
  .job-detail-swiper .swiper-button-prev:hover {
    background-color: #0088FF;
    color: white;
    transform: scale(1.1);
  }
  .job-detail-swiper {
    padding-bottom: 30px !important; /* Để chỗ cho pagination nếu cần */
  }
  .swiper-pagination-bullet-active {
    background-color: #0088FF !important;
  }\
`;
export default function JobDetailPage() {

    const { id } = useParams();
    const { user } = useAuth();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const [openLightbox, setOpenLightbox] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [infoJob, setInfoJob] = useState({
        name: '',
        minSalary: 0,
        maxSalary: 0,
        position: '',
        workstyle: '',
        address: "",
        location: {},
        tags: Array<string>(),
        images: Array<string>(),
        description: ""
    })

    const [infoCompany, setInfoCompany] = useState({
        id: 0,
        name: "",
        avatar: "",
        model: "",
        scale: "",
        startWork: 0,
        endWork: 0,
        overtime: false
    })

    const [hasCV, setHasCV] = useState(false);
    useEffect(() => {
        const init = async () => {
            const jobRes = await axios.get(`${BACKEND_URL}/job/get/${id}`)
            setInfoJob(jobRes.data);
            const companyRes = await axios.get(`${BACKEND_URL}/company/${jobRes.data.companyID}`)
            setInfoCompany(companyRes.data);
            if (!!user) {
                const cvRes = await api.get(`/cv/${id}`);
                if (cvRes.status == 200) setHasCV(true);
            }
        }
        init();
        document.title = 'Chi tiết công việc'
    }, [id, user])


    return (
        <>
            <style>{customSwiperStyles}</style>
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
                                    {infoJob.name}
                                </h1>
                                <div className="mb-[10px] text-[16px] font-[400] text-[#414042]">
                                    {infoCompany.name}
                                </div>
                                <div className="mb-[10px] text-[20px] font-[700] text-[#0088FF] sm:mb-[20px]">
                                    {infoJob.minSalary.toLocaleString() + "$ - " + infoJob.maxSalary.toLocaleString() + "$"}
                                </div>
                                {
                                    hasCV ? (
                                        <Link
                                            to={`/job/${id}/mycv`}
                                            className="mb-[20px] block rounded-[4px] bg-[#0088FF] p-[14px] text-center text-[16px] font-bold text-white"
                                        >
                                            Xem CV của bạn
                                        </Link>
                                    ) : user?.role == "ROLE_COMPANY" ? (
                                        <Link
                                            to={`/dashboard/company/job/${id}/view`}
                                            className="mb-[20px] block rounded-[4px] bg-[#0088FF] p-[14px] text-center text-[16px] font-bold text-white"
                                        >
                                            Xem CV đã nộp
                                        </Link>
                                    ) : (
                                        <Link
                                            to={`/job/${id}/apply`}
                                            className="mb-[20px] block rounded-[4px] bg-[#0088FF] p-[14px] text-center text-[16px] font-bold text-white"
                                        >
                                            Ứng tuyển
                                        </Link>
                                    )
                                }
                                <div className="mb-[20px]">
                                    {infoJob.images && infoJob.images.length > 0 ? (
                                        <div className="relative group">

                                            <Swiper
                                                modules={[Navigation, Pagination, Autoplay]}
                                                navigation={{
                                                    nextEl: '.custom-next',
                                                    prevEl: '.custom-prev',
                                                }}
                                                spaceBetween={15}
                                                slidesPerView={1}
                                                pagination={{ clickable: true }}
                                                autoplay={{
                                                    delay: 3000,
                                                    disableOnInteraction: false,
                                                }}
                                                breakpoints={{
                                                    640: { slidesPerView: 2 },
                                                    1024: { slidesPerView: 2.5 },
                                                }}
                                                className="w-full rounded-[8px] job-detail-swiper"
                                            >
                                                {infoJob.images.map((value, index) => (
                                                    <SwiperSlide key={index}>
                                                        <div
                                                            className="overflow-hidden rounded-[8px] cursor-pointer group/item relative"
                                                            onClick={() => {
                                                                setPhotoIndex(index);
                                                                setOpenLightbox(true);
                                                            }}
                                                        >
                                                            <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors z-10" />
                                                            <img
                                                                src={value}
                                                                alt={`Job image ${index + 1}`}
                                                                className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                                                            />
                                                        </div>
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                            <div className="custom-prev absolute top-1/2 -translate-y-1/2 left-2 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer text-gray-800 hover:text-[#0088FF] transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                                <FaAngleLeft size={18} />
                                            </div>
                                            <div className="custom-next absolute top-1/2 -translate-y-1/2 right-2 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer text-gray-800 hover:text-[#0088FF] transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                                <FaAngleRight size={18} />
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-sm italic">Không có hình ảnh mô tả.</div>
                                    )}
                                </div>
                                <div className="mb-[10px] flex items-center gap-[8px] text-[14px]">
                                    <FaUserTie className="text-[16px]" />{' '}
                                    {translation[infoJob.position]}
                                </div>
                                <div className="mb-[10px] flex items-center gap-[8px] text-[14px]">
                                    <FaBriefcase className="text-[16px]" />
                                    {translation[infoJob.workstyle]}
                                </div>
                                <div className="mb-[10px] flex items-center gap-[8px] text-[14px]">
                                    <FaLocationDot className="text-[16px]" />{' '}
                                    {infoJob.address}
                                </div>
                                <div className="mb-[10px] flex items-center gap-[8px] text-[14px]">
                                    <FaGlobe className="text-[16px]" />{' '}
                                    {infoJob.location.name}
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
                            <div className="mt-[20px] rounded-[8px] border border-[#DEDEDE] p-[20px] whitespace-pre-line">
                                {infoJob.description}
                            </div>
                        </div>
                        {/* Right  */}
                        <div className="flex-1">
                            {/* Thong tin cong ty  */}
                            <div className="rounded-[8px] border border-[#DEDEDE] p-[20px]">
                                <div className="flex gap-[12px]">
                                    <div className="aspect-square w-[100px] truncate rounded-[4px]">
                                        <img
                                            src={infoCompany.avatar}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-[10px] text-[18px] font-bold text-[#121212]">
                                            {infoCompany.name}
                                        </div>
                                        <Link
                                            to={`/company/${infoCompany.id}`}
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
                                            {translation[infoCompany.model]}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-[10px]">
                                        <div className="text-[16px] font-[400] text-[#A6A6A6]">
                                            Quy mô công ty
                                        </div>
                                        <div className="text-right text-[16px] font-[400] text-[#121212]">
                                            {translation[infoCompany.scale]}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-[10px]">
                                        <div className="text-[16px] font-[400] text-[#A6A6A6]">
                                            Thời gian làm việc
                                        </div>
                                        <div className="text-right text-[16px] font-[400] text-[#121212]">
                                            {`Thứ ${infoCompany.startWork} - Thứ ${infoCompany.endWork}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-[10px]">
                                        <div className="text-[16px] font-[400] text-[#A6A6A6]">
                                            Làm việc ngoài giờ
                                        </div>
                                        <div className="text-right text-[16px] font-[400] text-[#121212]">
                                            {infoCompany.overtime ? "Có OT" : "Không có OT"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Lightbox
                open={openLightbox}
                close={() => setOpenLightbox(false)}
                index={photoIndex}
                slides={infoJob.images.map(src => ({ src: src }))}
                styles={{
                    container: {
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        backdropFilter: "blur(10px)"
                    }
                }}
                controller={{ closeOnBackdropClick: true }}
            />
        </>
    )
}
