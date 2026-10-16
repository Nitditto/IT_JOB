export interface JobMatchResult {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    advice: string[];
}

export interface JobMatchInput {
    profileText: string;
    profileSkills?: string[];
    jobTags: string[];
}

const MAX_ADVICE_SKILLS = 3;

const normalize = (text: string): string =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Match whole skill tokens so "java" does not accidentally match "javascript".
const containsSkill = (normalizedProfile: string, skill: string): boolean => {
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(normalize(skill).trim())}($|[^a-z0-9+#.])`);
    return pattern.test(normalizedProfile);
};

const buildAdvice = (missing: string[], hasProfileText: boolean, hasSkills: boolean): string[] => {
    const advice: string[] = [];
    if (!hasSkills) {
        advice.push('Hãy cập nhật danh sách kỹ năng trong hồ sơ để điểm phù hợp chính xác hơn.');
    }
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

export const computeJobMatch = ({ profileText, profileSkills = [], jobTags }: JobMatchInput): JobMatchResult => {
    const normalizedProfile = normalize(profileText);
    const normalizedSkillSet = new Set(
        profileSkills
            .map(skill => normalize(skill).trim())
            .filter(Boolean)
    );
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const tag of jobTags) {
        const normalizedTag = normalize(tag).trim();
        const skillMatched = normalizedSkillSet.has(normalizedTag);
        const textMatched = containsSkill(normalizedProfile, tag);
        (skillMatched || textMatched ? matchingSkills : missingSkills).push(tag);
    }

    const score = jobTags.length === 0 ? 0 : Math.round((matchingSkills.length / jobTags.length) * 100);
    return {
        score,
        matchingSkills,
        missingSkills,
        advice: buildAdvice(missingSkills, normalizedProfile.trim().length > 0, normalizedSkillSet.size > 0),
    };
};
