import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { motion } from 'framer-motion';
import { Sparkles, DollarSign, MapPin, ArrowRight } from 'lucide-react';

interface JobItem {
    id: number;
    name: string;
    tags: string[];
    position: string;
    minSalary: number;
    maxSalary: number;
    companyName: string;
    companyAvatar: string;
    salaryCurrency: string | null;
    location: { name: string };
}

interface Recommendation {
    job: JobItem;
    matchPercentage: number;
}

export const RecommendedJobs = () => {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'ROLE_USER') {
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const res = await api.get<Recommendation[]>('/jobs/recommendations');
                setRecommendations(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("RecommendedJobs Error:", err);
                setRecommendations([]);
            }
            finally { setLoading(false); }
        };
        load();
    }, [user]);

    if (!user || user.role !== 'ROLE_USER') return null;

    return (
        <div className="py-16 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-slate-950">
            <div className="container">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                            <Sparkles size={12} />
                            Gợi ý theo hồ sơ của bạn
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Việc làm phù hợp cho bạn
                        </h2>
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 animate-pulse border border-slate-100 dark:border-slate-800">
                                <div className="flex gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                    <div className="flex-1">
                                        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                                        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recommendations.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={recommendations.length > 0 ? "show" : "hidden"}
                        variants={{
                            show: { opacity: 1 },
                            hidden: { opacity: 0 }
                        }}
                        className="grid md:grid-cols-2 gap-4"
                    >
                        {recommendations.map(({ job, matchPercentage }, idx) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Link
                                    to={`/job/${job.id}`}
                                    className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-800"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 shadow-sm flex-shrink-0">
                                            <img src={job.companyAvatar} alt="" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                {job.name}
                                            </h3>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{job.companyName}</div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                                                    <DollarSign size={10} /> {(job.minSalary ?? 0).toLocaleString()} - {(job.maxSalary ?? 0).toLocaleString()} {job.salaryCurrency ?? ''}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin size={10} /> {job.location.name}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors mt-1" />
                                    </div>

                                    <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg">
                                        💡 Phù hợp {Math.round(matchPercentage)}% với hồ sơ của bạn
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 font-medium">
                        Dựa trên hồ sơ của bạn, hiện chưa tìm thấy gợi ý phù hợp nhất. <br/> Hãy cập nhật thêm thông tin hồ sơ để gợi ý chính xác hơn!
                    </div>
                )}
            </div>
        </div>
    );
};
