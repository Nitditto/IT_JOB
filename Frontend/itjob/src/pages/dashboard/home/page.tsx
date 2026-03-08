import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { generateDashboardInsight, type DashboardInsightContext } from "../../../utils/gemini";
import axios from "axios";
import api from "../../../utils/api";
import { Link } from "react-router";
import { motion } from "framer-motion";
import type { Tag } from "../../../types";
import {
    Briefcase, Building2, FileText, TrendingUp, Sparkles, ArrowRight,
    Search, PlusCircle, Star, RefreshCw, Zap, Users, BarChart3
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 20, stiffness: 200 } }
};

function formatText(text: string) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');
}

export default function DashboardHomePage() {
    const { user } = useAuth();
    const [jobCount, setJobCount] = useState(0);
    const [companyCount, setCompanyCount] = useState(0);
    const [cvCount, setCvCount] = useState(0);
    const [tags, setTags] = useState<Tag[]>([]);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const role = user?.role || "ROLE_USER";
    const isUser = role === "ROLE_USER";
    const isCompany = role === "ROLE_COMPANY";
    const isAdmin = role === "ROLE_ADMIN";

    useEffect(() => {
        document.title = "Tổng quan — IT.JOB Dashboard";
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [jobRes, companyRes, tagRes] = await Promise.all([
                axios.get(`${BACKEND_URL}/job/count`),
                axios.get(`${BACKEND_URL}/company/list`),
                axios.get(`${BACKEND_URL}/job/tags`),
            ]);
            setJobCount(jobRes.data);
            setCompanyCount(companyRes.data?.length || 0);
            setTags(tagRes.data || []);

            // Fetch user CVs if role is user
            if (isUser) {
                try {
                    const cvRes = await api.get(`${BACKEND_URL}/cv/list`);
                    setCvCount(Array.isArray(cvRes.data) ? cvRes.data.length : 0);
                } catch { setCvCount(0); }
            }

            setIsLoaded(true);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            setIsLoaded(true);
        }
    };

    const fetchAIInsight = async () => {
        setIsLoadingInsight(true);
        try {
            const context: DashboardInsightContext = {
                role: role as DashboardInsightContext['role'],
                userName: user?.name,
                jobCount,
                companyCount,
                cvCount,
                topTags: tags.slice(0, 5).map(t => t.tag),
                userProfile: isUser ? {
                    lookingfor: user?.lookingfor,
                    status: user?.status,
                } : undefined,
            };
            const insight = await generateDashboardInsight(context);
            setAiInsight(insight);
        } catch (error) {
            setAiInsight("❌ Không thể tải được gợi ý AI lúc này. Vui lòng thử lại sau.");
        } finally {
            setIsLoadingInsight(false);
        }
    };

    useEffect(() => {
        if (isLoaded && jobCount > 0) {
            fetchAIInsight();
        }
    }, [isLoaded]);

    const now = new Date();
    const greeting = now.getHours() < 12 ? "Chào buổi sáng" : now.getHours() < 18 ? "Chào buổi chiều" : "Chào buổi tối";
    const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const statCards = [
        { icon: <Briefcase size={22} />, label: "Việc làm đang tuyển", value: jobCount, color: "from-indigo-500 to-indigo-600", iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300" },
        { icon: <Building2 size={22} />, label: "Nhà tuyển dụng", value: companyCount, color: "from-violet-500 to-violet-600", iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300" },
        { icon: <TrendingUp size={22} />, label: "Công nghệ trending", value: tags.length, color: "from-emerald-500 to-emerald-600", iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300" },
        ...(isUser ? [{ icon: <FileText size={22} />, label: "CV đã nộp", value: cvCount, color: "from-amber-500 to-amber-600", iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300" }] : []),
    ];

    const quickActions = isUser ? [
        { icon: <Search size={18} />, label: "Tìm việc IT", to: "/search", color: "bg-indigo-600 hover:bg-indigo-700" },
        { icon: <PlusCircle size={18} />, label: "Tạo CV mới", to: "/dashboard/cv/templates", color: "bg-violet-600 hover:bg-violet-700" },
        { icon: <Star size={18} />, label: "Đánh giá CV bằng AI", to: "/dashboard/cv/upload-review", color: "bg-emerald-600 hover:bg-emerald-700" },
    ] : isCompany ? [
        { icon: <PlusCircle size={18} />, label: "Đăng tin tuyển dụng", to: "/dashboard/company/job/create", color: "bg-indigo-600 hover:bg-indigo-700" },
        { icon: <BarChart3 size={18} />, label: "Quản lý công việc", to: "/dashboard/company/job", color: "bg-violet-600 hover:bg-violet-700" },
    ] : [
        { icon: <Users size={18} />, label: "Quản lý tài khoản", to: "/dashboard/admin/register", color: "bg-indigo-600 hover:bg-indigo-700" },
        { icon: <BarChart3 size={18} />, label: "Quản lý công việc", to: "/dashboard/company/job", color: "bg-violet-600 hover:bg-violet-700" },
    ];

    return (
        <div className="p-6 md:p-8 min-h-full bg-slate-50 dark:bg-slate-950">
            <motion.div
                className="max-w-6xl mx-auto space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Welcome Header */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl p-6 md:p-8"
                    style={{ background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #7c3aed 100%)" }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-indigo-200 text-sm font-medium mb-1">{dateStr}</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {greeting}, <span className="text-violet-200">{user?.name || "bạn"}</span> 👋
                        </h1>
                        <p className="text-indigo-200 text-sm md:text-base max-w-xl">
                            {isUser && "Khám phá cơ hội nghề nghiệp IT phù hợp nhất với bạn hôm nay."}
                            {isCompany && "Quản lý tin tuyển dụng và tìm kiếm ứng viên tài năng."}
                            {isAdmin && "Tổng quan hoạt động nền tảng IT.JOB."}
                        </p>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                    {quickActions.map((action, idx) => (
                        <Link
                            key={idx}
                            to={action.to}
                            className={`${action.color} text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98]`}
                        >
                            {action.icon} {action.label}
                        </Link>
                    ))}
                </motion.div>

                {/* Stats Cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-0.5">
                                {isLoaded ? stat.value.toLocaleString() : "—"}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* AI Insight Card — takes 2 cols */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-base">
                                <Sparkles size={18} className="text-violet-500" />
                                AI Insights
                            </h2>
                            <button
                                onClick={fetchAIInsight}
                                disabled={isLoadingInsight}
                                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={isLoadingInsight ? "animate-spin" : ""} />
                                Làm mới
                            </button>
                        </div>
                        <div className="p-6">
                            {isLoadingInsight ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="relative w-16 h-16 mb-4">
                                        <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles size={18} className="text-indigo-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">AI đang phân tích dữ liệu...</p>
                                </div>
                            ) : aiInsight ? (
                                <div
                                    className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: formatText(aiInsight) }}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <Zap size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu để phân tích</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Trending Tags — takes 1 col */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-base">
                                <TrendingUp size={18} className="text-emerald-500" />
                                Công nghệ Trending
                            </h2>
                        </div>
                        <div className="p-4">
                            {tags.length > 0 ? (
                                <div className="space-y-2">
                                    {tags.slice(0, 8).map((tag, idx) => (
                                        <Link
                                            key={idx}
                                            to={`/search?tags=${tag.tag}`}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                                                    idx === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                                                            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {tag.tag}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                                                {tag.count} việc
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-6">Đang tải...</p>
                            )}
                            {tags.length > 8 && (
                                <Link to="/search" className="flex items-center justify-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-3 hover:underline">
                                    Xem tất cả <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
