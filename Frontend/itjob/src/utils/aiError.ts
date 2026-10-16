import axios from 'axios';

const STATUS_MESSAGES: Record<number, string> = {
    401: '🔒 Vui lòng đăng nhập để sử dụng tính năng AI.',
    403: '🔒 Vui lòng đăng nhập để sử dụng tính năng AI.',
    429: '⏳ Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.',
    503: '🛠️ Tính năng AI hiện chưa khả dụng, vui lòng thử lại sau.',
};

const DEFAULT_MESSAGE = '❌ Không thể kết nối tới AI, vui lòng thử lại sau.';

export const describeAiError = (error: unknown): string => {
    if (axios.isAxiosError(error) && error.response) {
        return STATUS_MESSAGES[error.response.status] ?? DEFAULT_MESSAGE;
    }
    return DEFAULT_MESSAGE;
};
