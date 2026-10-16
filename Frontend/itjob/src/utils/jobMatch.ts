export interface JobMatchResult {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    advice: string[];
}

export interface JobMatchInput {
    profileText: string;
    jobTags: string[];
}

const MAX_ADVICE_SKILLS = 3;

const normalize = (text: string): string =>
    text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Khớp nguyên từ để "java" không khớp nhầm "javascript"; ký tự + # . thuộc tên kỹ năng (c++, c#, node.js)
const containsSkill = (normalizedProfile: string, skill: string): boolean => {
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(normalize(skill).trim())}($|[^a-z0-9+#.])`);
    return pattern.test(normalizedProfile);
};

const buildAdvice = (missing: string[], hasProfileText: boolean): string[] => {
    const advice: string[] = [];
    if (!hasProfileText) {
        advice.push('Hãy cập nhật mục "đang tìm kiếm" và mô tả trong hồ sơ để đánh giá chính xác hơn.');
    }
    if (missing.length > 0) {
        advice.push(`Bổ sung hoặc nêu rõ kinh nghiệm với: ${missing.slice(0, MAX_ADVICE_SKILLS).join(', ')}.`);
    }
    if (advice.length === 0) {
        advice.push('Hồ sơ của bạn đã bao phủ các kỹ năng chính của vị trí này, hãy nộp CV sớm.');
    }
    return advice;
};

/** Tính độ phù hợp bằng tỷ lệ kỹ năng (tag) của job xuất hiện trong hồ sơ ứng viên — không dùng LLM. */
export const computeJobMatch = ({ profileText, jobTags }: JobMatchInput): JobMatchResult => {
    const normalizedProfile = normalize(profileText);
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];
    for (const tag of jobTags) {
        (containsSkill(normalizedProfile, tag) ? matchingSkills : missingSkills).push(tag);
    }
    const score = jobTags.length === 0 ? 0 : Math.round((matchingSkills.length / jobTags.length) * 100);
    return {
        score,
        matchingSkills,
        missingSkills,
        advice: buildAdvice(missingSkills, normalizedProfile.trim().length > 0),
    };
};
