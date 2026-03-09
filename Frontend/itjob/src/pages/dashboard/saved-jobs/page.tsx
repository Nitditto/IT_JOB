import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getBookmarks, removeBookmark, type BookmarkedJob } from '@/utils/bookmarks';
import translation from '@/utils/translation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, DollarSign, MapPin, Briefcase, BookmarkX } from 'lucide-react';

export default function SavedJobsPage() {
    const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([]);

    const loadBookmarks = () => setBookmarks(getBookmarks());

    useEffect(() => {
        loadBookmarks();
        window.addEventListener('bookmarks-changed', loadBookmarks);
        return () => window.removeEventListener('bookmarks-changed', loadBookmarks);
    }, []);

    const handleRemove = (id: number) => {
        removeBookmark(id);
        loadBookmarks();
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/20">
                        <Heart size={18} className="text-white" fill="white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Việc làm đã lưu</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{bookmarks.length} công việc</p>
                    </div>
                </div>
            </div>

            {bookmarks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <BookmarkX size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-1">Chưa có việc làm nào được lưu</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Nhấn biểu tượng ❤️ trên các việc làm để lưu lại</p>
                    <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        Tìm việc ngay
                    </Link>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {bookmarks.map((job) => (
                            <motion.div
                                key={job.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md hover:shadow-indigo-500/5 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Company Avatar */}
                                    <Link to={`/job/${job.id}`} className="flex-shrink-0">
                                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 shadow-sm">
                                            <img src={job.companyAvatar} alt="" className="w-full h-full object-contain" />
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/job/${job.id}`} className="group/link">
                                            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors truncate">
                                                {job.name}
                                            </h3>
                                        </Link>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">{job.companyName}</div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                                                <DollarSign size={10} /> {job.minSalary.toLocaleString()} - {job.maxSalary.toLocaleString()}$
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Briefcase size={10} /> {translation[job.position] || job.position}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin size={10} /> {job.location}
                                            </span>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {job.tags.slice(0, 4).map((tag, i) => (
                                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleRemove(job.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                            title="Bỏ lưu"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="text-[10px] text-slate-300 dark:text-slate-600">
                                            {new Date(job.savedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
