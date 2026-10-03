import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { generateSalaryInsights, type SalaryInsight } from '@/utils/gemini';
import { BarChart3, Sparkles } from 'lucide-react';

export const SalaryInsights = () => {
    const [insights, setInsights] = useState<SalaryInsight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await generateSalaryInsights();
                setInsights(data);
            } catch { setInsights([]); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // if (!loading && insights.length === 0) return null;

    const demandColor = (d: string) => {
        if (d.includes('Rất cao') || d.includes('rất cao')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400';
        if (d.includes('Cao') || d.includes('cao')) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400';
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400';
    };

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
                        Mức lương tham khảo theo vị trí, cập nhật từ thị trường Việt Nam
                    </p>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 animate-pulse">
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
                                key={idx}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 hover:shadow-md hover:shadow-indigo-500/5 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.position}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${demandColor(item.demand)}`}>
                                        {item.demand}
                                    </span>
                                </div>

                                {/* Salary bar */}
                                <div className="mb-3">
                                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        ${item.avgSalary.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500">
                                        ${item.minSalary.toLocaleString()} — ${item.maxSalary.toLocaleString()}/tháng
                                    </div>
                                </div>

                                {/* Range bar visual */}
                                <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="absolute h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full transition-all"
                                        style={{ left: `${(item.minSalary / 5000) * 100}%`, width: `${((item.maxSalary - item.minSalary) / 5000) * 100}%` }}
                                    />
                                </div>

                                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    {item.techStack}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-10 text-slate-400 italic">
                        Đang phân tích xu hướng thị trường...
                    </div>
                )}

                <div className="mt-6 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <Sparkles size={12} className="text-emerald-400" />
                        Dữ liệu lương tham khảo, tổng hợp bởi AI
                    </span>
                </div>
            </div>
        </div>
    );
};
