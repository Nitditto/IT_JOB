const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

const normalize = (text: string): string =>
    text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Gợi ý tag khớp với từ cuối người dùng đang gõ; tag bắt đầu bằng từ khoá xếp trước tag chỉ chứa từ khoá. */
export const getSearchSuggestions = (query: string, availableTags: string[]): string[] => {
    const needle = normalize(query);
    if (needle.length < MIN_QUERY_LENGTH) {
        return [];
    }
    const startsWith: string[] = [];
    const contains: string[] = [];
    for (const tag of availableTags) {
        const normalizedTag = normalize(tag);
        if (normalizedTag === needle) {
            continue;
        }
        if (normalizedTag.startsWith(needle)) {
            startsWith.push(tag);
        } else if (normalizedTag.includes(needle)) {
            contains.push(tag);
        }
    }
    return [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
};
