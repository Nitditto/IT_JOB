import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertCircle, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router';

interface FieldCheck {
    label: string;
    filled: boolean;
    link: string;
}

export const ProfileCompleteness = () => {
    const { user } = useAuth();
    if (!user || user.role !== 'ROLE_USER') return null;

    const fields: FieldCheck[] = [
        { label: 'Ảnh đại diện', filled: !!user.avatar, link: '/dashboard/settings/user-profile' },
        { label: 'Số điện thoại', filled: !!user.phone, link: '/dashboard/settings/user-profile' },
        { label: 'Mô tả bản thân', filled: !!user.description, link: '/dashboard/settings/user-profile' },
        { label: 'Mong muốn nghề nghiệp', filled: !!user.lookingfor, link: '/dashboard/settings/user-profile' },
        { label: 'Địa chỉ', filled: !!user.address, link: '/dashboard/settings/user-profile' },
        { label: 'Khu vực', filled: !!user.location, link: '/dashboard/settings/user-profile' },
    ];

    const filled = fields.filter(f => f.filled).length;
    const total = fields.length;
    const percent = Math.round((filled / total) * 100);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <User size={16} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hoàn thiện hồ sơ</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{filled}/{total} mục đã hoàn thành</p>
                </div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-slate-800" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="url(#profileGrad)" strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={`${percent * 1.508} 151`} />
                        <defs><linearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{percent}%</span>
                    </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {percent === 100
                        ? '🎉 Hồ sơ đã hoàn thiện! Bạn sẽ được ưu tiên gợi ý việc làm.'
                        : 'Hoàn thiện hồ sơ để nhận gợi ý việc làm chính xác hơn.'
                    }
                </div>
            </div>

            {/* Field checklist */}
            <div className="space-y-2">
                {fields.filter(f => !f.filled).slice(0, 3).map((field, idx) => (
                    <Link
                        key={idx}
                        to={field.link}
                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors"
                    >
                        <AlertCircle size={12} />
                        <span className="flex-1">{field.label}</span>
                        <ArrowRight size={10} />
                    </Link>
                ))}
                {fields.filter(f => f.filled).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        {fields.filter(f => f.filled).map((field, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 size={8} /> {field.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
