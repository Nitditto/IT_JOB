import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import api from '@/utils/api';
import { Users, MapPin, ExternalLink, Database, TrendingUp } from 'lucide-react';

interface Company {
    id: number;
    name: string;
    industry: string | null;
    description: string | null;
    scale: 'small' | 'medium' | 'large' | null;
    location: { name: string } | null;
}

const COMPANY_LIMIT = 8;

const SCALE_LABEL: Record<string, string> = {
    small: 'Dưới 150 nhân sự',
    medium: '151 - 300 nhân sự',
    large: 'Trên 300 nhân sự',
};

export const MarketCompanies = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get<Company[]>('/companies', { params: { limit: COMPANY_LIMIT } });
                setCompanies(Array.isArray(res.data) ? res.data : []);
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

    // Don't return null if empty, show something so we know it's there
    // if (!loading && companies.length === 0) return null;

    return (
        <div className="py-20 bg-slate-50 dark:bg-slate-950">
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
                        Xếp theo số tin tuyển dụng đang có trên IT.JOB
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse">
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
                ) : companies.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate={companies.length > 0 ? "show" : "hidden"}
                        className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4"
                    >
                        {companies.map((company) => (
                            <motion.div key={company.id} variants={itemVariants}>
                                <Link
                                    to={`/company/${company.id}`}
                                    className="group block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800 h-full"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
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

                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                                        {company.description}
                                    </p>

                                    <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Users size={10} /> {company.scale ? SCALE_LABEL[company.scale] : 'Chưa cập nhật'}
                                        </div>
                                        {company.location && (
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <MapPin size={10} /> {company.location?.name}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-12 text-slate-400 italic">
                        Chưa có công ty nào để hiển thị.
                    </div>
                )}

                {/* AI Badge */}
                {!loading && companies.length > 0 && (
                    <div className="mt-6 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <Database size={12} className="text-indigo-400" />
                            Dữ liệu từ các công ty đang tuyển trên IT.JOB
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
