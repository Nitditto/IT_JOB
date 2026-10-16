export interface DashboardTipsContext {
    role: 'ROLE_USER' | 'ROLE_COMPANY' | 'ROLE_ADMIN';
    jobCount: number;
    companyCount: number;
    cvCount: number;
    topTags: string[];
}

const formatTags = (tags: string[]): string => tags.join(', ');

const candidateTips = (context: DashboardTipsContext): string[] => {
    const tips: string[] = [];
    if (context.jobCount > 0 && context.topTags.length > 0) {
        tips.push(`🔥 Có ${context.jobCount} việc IT đang tuyển, nhiều nhất ở: ${formatTags(context.topTags)}.`);
    }
    tips.push(context.cvCount === 0
        ? '📄 Bạn chưa nộp CV nào — chọn một vị trí phù hợp và nộp ngay hôm nay.'
        : `📬 Bạn đã nộp ${context.cvCount} CV — theo dõi trạng thái xét duyệt ở mục CV của tôi.`);
    return tips;
};

const companyTips = (context: DashboardTipsContext): string[] => {
    const tips = [`🏢 Có ${context.companyCount} công ty và ${context.jobCount} tin tuyển dụng trên nền tảng.`];
    if (context.topTags.length > 0) {
        tips.push(`🎯 Ứng viên quan tâm nhiều tới: ${formatTags(context.topTags)} — nêu rõ các công nghệ này trong tin nếu phù hợp.`);
    }
    tips.push('⏱️ Duyệt CV sớm giúp bạn không bỏ lỡ ứng viên tốt.');
    return tips;
};

const adminTips = (context: DashboardTipsContext): string[] => {
    const tips = [`📊 Nền tảng có ${context.jobCount} việc làm và ${context.companyCount} công ty.`];
    if (context.topTags.length > 0) {
        tips.push(`📈 Công nghệ đang nổi: ${formatTags(context.topTags)}.`);
    }
    return tips;
};

/** Tạo lời khuyên dashboard bằng quy tắc dựa trên số liệu thật — không dùng LLM. */
export const buildDashboardTips = (context: DashboardTipsContext): string[] => {
    switch (context.role) {
        case 'ROLE_COMPANY':
            return companyTips(context);
        case 'ROLE_ADMIN':
            return adminTips(context);
        default:
            return candidateTips(context);
    }
};
