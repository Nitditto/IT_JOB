import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import axios from 'axios';
import translation from '@/utils/translation';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Briefcase, UserCircle, Globe, DollarSign, Building2, Clock, Users, ArrowRight, Sparkles, Brain, Target, CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeJobMatch, generateInterviewQuestions, type JobMatchResult } from '@/utils/gemini';

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
    display:none;
  }
  .job-detail-swiper {
    padding-bottom: 30px !important;
  }
  .swiper-pagination-bullet-active {
    background-color: #4f46e5 !important;
  }
`;

export default function JobDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const [openLightbox, setOpenLightbox] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [infoJob, setInfoJob] = useState({
        name: '', minSalary: 0, maxSalary: 0, position: '', workstyle: '',
        address: "", location: {} as any, tags: Array<string>(), images: Array<string>(), description: ""
    })
    const [infoCompany, setInfoCompany] = useState({
        id: 0, name: "", avatar: "", model: "", scale: "", startWork: 0, endWork: 0, overtime: false
    })
    const [hasCV, setHasCV] = useState(false);
    const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
    const [matchLoading, setMatchLoading] = useState(false);
    const [interviewQuestions, setInterviewQuestions] = useState('');
    const [interviewLoading, setInterviewLoading] = useState(false);
    const [showInterview, setShowInterview] = useState(false);

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

    const actionButton = hasCV ? (
        <Link to={`/job/${id}/mycv`}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg active:scale-[0.98]">
            Xem CV của bạn <ArrowRight size={16} />
        </Link>
    ) : user?.role == "ROLE_COMPANY" ? (
        <Link to={`/dashboard/company/job/${id}/view`}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all shadow-md shadow-violet-500/20 hover:shadow-lg active:scale-[0.98]">
            Xem CV đã nộp <ArrowRight size={16} />
        </Link>
    ) : (
        <Link to={`/job/${id}/apply`}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg active:scale-[0.98]">
            Ứng tuyển ngay <ArrowRight size={16} />
        </Link>
    );

    return (
        <>
            <style>{customSwiperStyles}</style>
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-16">
                {/* Job Header */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 dark:from-indigo-900 dark:via-indigo-950 dark:to-violet-950 py-10">
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-4xl"
                        >
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{infoJob.name}</h1>
                            <p className="text-indigo-200 text-base mb-4">{infoCompany.name}</p>
                            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white font-bold px-4 py-2 rounded-xl text-base">
                                <DollarSign size={16} />
                                {infoJob.minSalary.toLocaleString() + "$ - " + infoJob.maxSalary.toLocaleString() + "$"}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <div className="container -mt-4">
                    <div className="flex flex-wrap gap-6">
                        {/* Left Column */}
                        <div className="w-full lg:w-[65%] space-y-5">
                            {/* Action Button (mobile-first on top) */}
                            <div className="lg:hidden">{actionButton}</div>

                            {/* Image Carousel */}
                            {infoJob.images && infoJob.images.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
                                >
                                    <div className="relative group">
                                        <Swiper
                                            modules={[Navigation, Pagination, Autoplay]}
                                            spaceBetween={12}
                                            slidesPerView={1}
                                            pagination={{ clickable: true }}
                                            autoplay={{ delay: 4000, disableOnInteraction: false }}
                                            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 2.5 } }}
                                            className="w-full rounded-xl job-detail-swiper"
                                        >
                                            {infoJob.images.map((value, index) => (
                                                <SwiperSlide key={index}>
                                                    <div className="overflow-hidden rounded-xl cursor-pointer group/item relative"
                                                        onClick={() => { setPhotoIndex(index); setOpenLightbox(true); }}>
                                                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors z-10" />
                                                        <img src={value} alt={`Job image ${index + 1}`}
                                                            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                                                    </div>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    </div>
                                </motion.div>
                            )}

                            {/* Job Info Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                            >
                                <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Thông tin công việc</h2>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <UserCircle size={18} className="text-indigo-500" />
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Vị trí</div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{translation[infoJob.position]}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <Briefcase size={18} className="text-violet-500" />
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Hình thức</div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{translation[infoJob.workstyle]}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <MapPin size={18} className="text-emerald-500" />
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Địa điểm</div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{infoJob.address}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <Globe size={18} className="text-amber-500" />
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Khu vực</div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{infoJob.location.name}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {infoJob.tags.map((item, index) => (
                                        <span key={index} className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                            >
                                <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Mô tả công việc</h2>
                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                    {infoJob.description}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column */}
                        <div className="flex-1 space-y-5">
                            {/* Apply Button (desktop) */}
                            <div className="hidden lg:block">{actionButton}</div>

                            {/* Company Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 flex-shrink-0 shadow-sm">
                                        <img src={infoCompany.avatar} alt="" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 truncate">{infoCompany.name}</h3>
                                        <Link to={`/company/${infoCompany.id}`}
                                            className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                                            Xem công ty <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3">
                                    {[
                                        { icon: <Building2 size={16} className="text-slate-400" />, label: "Mô hình", value: translation[infoCompany.model] },
                                        { icon: <Users size={16} className="text-slate-400" />, label: "Quy mô", value: translation[infoCompany.scale] },
                                        { icon: <Clock size={16} className="text-slate-400" />, label: "Thời gian", value: `Thứ ${infoCompany.startWork} - Thứ ${infoCompany.endWork}` },
                                        { icon: <Briefcase size={16} className="text-slate-400" />, label: "OT", value: infoCompany.overtime ? "Có OT" : "Không có OT" },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                {item.icon} {item.label}
                                            </div>
                                            <div className="font-medium text-slate-900 dark:text-white">{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* AI Job Match Score */}
                            {user && user.role === 'ROLE_USER' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                            <Target size={16} className="text-white" />
                                        </div>
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white">AI Đánh giá phù hợp</h3>
                                    </div>

                                    {matchResult ? (
                                        <div className="space-y-4">
                                            {/* Score Circle */}
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-16 h-16 flex-shrink-0">
                                                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
                                                        <circle cx="32" cy="32" r="28" fill="none" stroke="url(#matchGradient)" strokeWidth="6" strokeLinecap="round"
                                                            strokeDasharray={`${matchResult.score * 1.76} 176`} />
                                                        <defs><linearGradient id="matchGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-lg font-bold text-slate-900 dark:text-white">{matchResult.score}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-semibold ${matchResult.score >= 70 ? 'text-emerald-600' : matchResult.score >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {matchResult.score >= 70 ? '🎯 Rất phù hợp' : matchResult.score >= 40 ? '⚡ Khá phù hợp' : '📚 Cần phát triển thêm'}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dựa trên kỹ năng & kinh nghiệm</p>
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            {matchResult.matchingSkills.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                                                        <CheckCircle2 size={12} /> Kỹ năng phù hợp
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {matchResult.matchingSkills.map((s, i) => (
                                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {matchResult.missingSkills.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                                                        <XCircle size={12} /> Cần bổ sung
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {matchResult.missingSkills.map((s, i) => (
                                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-medium">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Advice */}
                                            <div>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                                                    <Lightbulb size={12} /> Lời khuyên
                                                </div>
                                                <ul className="space-y-1">
                                                    {matchResult.advice.map((a, i) => (
                                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">• {a}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                setMatchLoading(true);
                                                try {
                                                    const result = await analyzeJobMatch(
                                                        [], user.lookingfor || '', infoJob.name, infoJob.tags, infoJob.position, infoJob.workstyle
                                                    );
                                                    setMatchResult(result);
                                                } catch { } finally { setMatchLoading(false); }
                                            }}
                                            disabled={matchLoading}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            {matchLoading ? (
                                                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                            ) : (
                                                <><Sparkles size={16} /> Phân tích mức độ phù hợp</>
                                            )}
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            {/* AI Interview Prep */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                            >
                                <button
                                    onClick={async () => {
                                        if (interviewQuestions) { setShowInterview(!showInterview); return; }
                                        setInterviewLoading(true); setShowInterview(true);
                                        try {
                                            const qs = await generateInterviewQuestions(infoJob.name, infoJob.tags, infoJob.position, infoCompany.name);
                                            setInterviewQuestions(qs);
                                        } catch { } finally { setInterviewLoading(false); }
                                    }}
                                    className="w-full p-5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                        <Brain size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">AI Luyện phỏng vấn</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Câu hỏi phỏng vấn cho vị trí này</div>
                                    </div>
                                    {showInterview ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                </button>

                                <AnimatePresence>
                                    {showInterview && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                                                {interviewLoading ? (
                                                    <div className="flex items-center gap-2 justify-center py-6 text-sm text-slate-500">
                                                        <div className="w-4 h-4 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                                                        AI đang tạo câu hỏi...
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto pr-2">
                                                        {interviewQuestions}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </div>

            <Lightbox
                open={openLightbox}
                close={() => setOpenLightbox(false)}
                index={photoIndex}
                slides={infoJob.images.map(src => ({ src }))}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(10px)" } }}
                controller={{ closeOnBackdropClick: true }}
            />
        </>
    )
}
