import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/utils/api';
import { BarChart3, Database } from 'lucide-react';

interface SalaryStat {
    tag: string;
    currency: string | null;
    jobCount: number;
    minSalary: number;
    maxSalary: number;
    avgSalary: number;
}

const formatMoney = (value: number, currency: string | null) =>
    `${Math.round(value).toLocaleString()} ${currency ?? ''}`.trim();

export const SalaryInsights = () => {
    const [insights, setInsights] = useState<SalaryStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get<SalaryStat[]>('/jobs/stats/salary');
                setInsights(Array.isArray(res.data) ? res.data : []);
            } catch { setInsights([]); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // if (!loading && insights.length === 0) return null;

    const scaleMax = Math.max(1, ...insights.map(item => item.maxSalary));

    return (
        <div className="py-16 bg-white dark:bg-slate-950">
            <div className="container">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                        <BarChart3 size={14} />
                        Salary Insights
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Khảo sát mức lương IT
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Mức lương tính từ các tin đang tuyển trên IT.JOB, theo công nghệ
                    </p>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 animate-pulse">
                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
                                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : insights.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={insights.length > 0 ? "show" : "hidden"}
                        variants={{
                            show: { opacity: 1, transition: { staggerChildren: 0.05 } },
                            hidden: { opacity: 0 }
                        }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {insights.map((item, idx) => (
                            <motion.div
                                key={`${item.tag}-${item.currency}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.tag}</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400">
                                        {item.jobCount} việc
                                    </span>
                                </div>

                                {/* Salary bar */}
                                <div className="mb-3">
                                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {formatMoney(item.avgSalary, item.currency)}
                                    </div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500">
                                        {formatMoney(item.minSalary, null)} — {formatMoney(item.maxSalary, item.currency)}
                                    </div>
                                </div>

                                {/* Range bar visual */}
                                <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="absolute h-full bg-indigo-600 rounded-full transition-all"
                                        style={{ left: `${(item.minSalary / scaleMax) * 100}%`, width: `${((item.maxSalary - item.minSalary) / scaleMax) * 100}%` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-10 text-slate-400 italic">
                        Chưa có đủ dữ liệu lương để thống kê.
                    </div>
                )}

                <div className="mt-6 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <Database size={12} className="text-emerald-400" />
                        Tổng hợp từ mức lương các tin tuyển dụng đang mở
                    </span>
                </div>
            </div>
        </div>
    );
};
