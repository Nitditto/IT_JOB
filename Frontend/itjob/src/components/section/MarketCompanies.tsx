import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchMarketCompanies, type MarketCompany } from '@/utils/gemini';
import { Users, Zap, ExternalLink, Sparkles, TrendingUp } from 'lucide-react';

export const MarketCompanies = () => {
    const [companies, setCompanies] = useState<MarketCompany[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchMarketCompanies();
                setCompanies(data);
            } catch {
                setCompanies([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } }
    };

    if (!loading && companies.length === 0) return null;

    return (
        <div className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <div className="container">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                        <TrendingUp size={14} />
                        Thị trường IT Việt Nam
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Top công ty IT đang tuyển dụng
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Dữ liệu tự động cập nhật từ các nền tảng tuyển dụng hàng đầu
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                    <div className="flex-1">
                                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                                        <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                                <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4"
                    >
                        {companies.map((company, index) => (
                            <motion.div key={index} variants={itemVariants}>
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-800 h-full"
                                >
                                    {/* Company Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                                            {company.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {company.name}
                                            </h3>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{company.industry}</div>
                                        </div>
                                        <ExternalLink size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                                        {company.description}
                                    </p>

                                    {/* Tech Stack */}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {company.techStack.slice(0, 3).map((tech, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium">
                                                {tech}
                                            </span>
                                        ))}
                                        {company.techStack.length > 3 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                                +{company.techStack.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Users size={10} /> {company.employees}
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-500 font-medium">
                                            <Zap size={10} /> {company.hiringStatus}
                                        </div>
                                    </div>
                                </a>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* AI Badge */}
                {!loading && companies.length > 0 && (
                    <div className="mt-6 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <Sparkles size={12} className="text-indigo-400" />
                            Dữ liệu được tổng hợp bởi AI từ các nguồn tuyển dụng IT
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
