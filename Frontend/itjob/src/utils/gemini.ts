import { GoogleGenerativeAI } from "@google/generative-ai";
// Lưu ý: Trong thực tế, KHÔNG NÊN để lộ API Key ở phía Frontend (Client-side).
// Tuy nhiên để demo nhanh nghiệm thu, ta tạm đặt qua biến môi trường hoặc cấu hình.
// Nên tạo một file .env và thêm VITE_GEMINI_API_KEY=your_api_key_here
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateCVSuggestion = async (promptText: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error("Vui lòng cấu hình GEMINI_API_KEY trong file .env");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(promptText);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        throw error;
    }
};

/**
 * Gợi ý viết lại cho mục Cụ thể trong CV
 */
export const suggestCVField = async (field: 'summary' | 'exp' | 'skill', currentText: string): Promise<string> => {
    // ... code cũ  ...
    const contextMap = {
        summary: "Đây là phần tóm tắt mục tiêu nghề nghiệp (Summary) trong CV. Hãy viết lại sao cho chuyên nghiệp, ấn tượng, tập trung vào giá trị đóng góp và ngắn gọn (dưới 50 từ).",
        exp: "Đây là phần mô tả kinh nghiệm làm việc (Experience) trong CV. Hãy viết lại theo chuẩn chuyên nghiệp, ưu tiên sử dụng gạch đầu dòng, các động từ mạnh (như đã phát triển, tối ưu, quản lý) và yêu cầu đưa ra các con số/kết quả định lượng nếu có thể.",
        skill: "Đây là danh sách kỹ năng trong CV. Hãy phân loại chúng rõ ràng (ví dụ: Kỹ năng chuyên môn, Công cụ, Kỹ năng mềm) và loại bỏ những kỹ năng quá cơ bản."
    };

    const prompt = `
Bạn là một chuyên gia tư vấn Nhân sự (HR) và viết CV chuyên nghiệp chuyên ngành CNTT (IT).
Yêu cầu: ${contextMap[field]}

Văn bản gốc của ứng viên:
"""
${currentText}
"""

Hãy trả về TRỰC TIẾP đoạn văn bản gợi ý để ứng viên copy paste vào CV. Đừng kèm theo các câu giải thích thừa như "Dưới đây là gợi ý...". Trả lời hoàn toàn bằng tiếng Việt.
`;

    return generateCVSuggestion(prompt);
};

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: [{ text: string }];
}

const CHATBOT_SYSTEM_PROMPT = `Bạn là "IT.JOB AI" — trợ lý tư vấn nghề nghiệp IT thông minh trên nền tảng IT.JOB.
Nhiệm vụ của bạn:
- Tư vấn nghề nghiệp IT (lộ trình, xu hướng, kỹ năng cần học)
- Gợi ý viết CV, chuẩn bị phỏng vấn
- Thông tin mức lương IT theo thị trường Việt Nam
- Hướng dẫn sử dụng các tính năng trên IT.JOB (tìm việc, tạo CV, đánh giá CV bằng AI)
- Giải đáp thắc mắc về công nghệ, framework, ngôn ngữ lập trình

Quy tắc:
1. Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
2. Câu trả lời ngắn gọn, dễ hiểu, có cấu trúc rõ ràng
3. Nếu không liên quan đến IT/công nghệ/tuyển dụng, hãy lịch sự từ chối và gợi ý quay lại chủ đề
4. Sử dụng emoji phù hợp để tạo sự thân thiện
5. Khi nói về lương, luôn nói rõ đơn vị (VNĐ) và khoảng (range)`;

export const chatWithAI = async (
    userMessage: string,
    history: ChatMessage[]
): Promise<string> => {
    if (!API_KEY) {
        throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY trong file .env");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: CHATBOT_SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Xin chào! 👋 Tôi là IT.JOB AI, trợ lý tư vấn nghề nghiệp IT của bạn. Tôi sẵn sàng hỗ trợ bạn!' }],
                },
                ...history,
            ],
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Lỗi khi gọi Gemini Chat API:", error);
        throw error;
    }
};

export const evaluateCVPDF = async (file: File): Promise<any> => {
    if (!API_KEY) {
        throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY trong file .env");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const generativePart = await fileToGenerativePart(file);

        const prompt = `
Bạn là một chuyên gia tuyển dụng cấp cao. Hãy đánh giá file CV đính kèm này.
Trả về nội dung HOÀN TOÀN DƯỚI DẠNG JSON hợp lệ theo format sau, không thêm markdown formatting wrap hay log dư thừa nào khác:
{
  "score": <số từ 1-100 đánh giá chất lượng tổng quan>,
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "weaknesses": ["<điểm cần cải thiện 1>", "<điểm cần cải thiện 2>"],
  "details": [
    {
      "page": 1,
      "y": <tọa độ Y ước tính từ trên xuống, khoảng 100-500>,
      "type": "warning" hoặc "error",
      "title": "<Tên mục cần sửa, VD: Phần Mục Tiêu>",
      "message": "<Lời khuyên hoặc nhận xét cụ thể>"
    }
  ]
}
Chỉ trả về JSON.
        `;

        const result = await model.generateContent([prompt, generativePart]);
        const response = await result.response;
        const textStr = response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        return JSON.parse(textStr);
    } catch (error) {
        console.error("Lỗi khi đánh giá PDF:", error);
        throw error;
    }
};

export interface DashboardInsightContext {
    role: 'ROLE_USER' | 'ROLE_COMPANY' | 'ROLE_ADMIN';
    userName?: string;
    jobCount?: number;
    companyCount?: number;
    cvCount?: number;
    topTags?: string[];
    userProfile?: {
        lookingfor?: string | null;
        status?: string | null;
    };
}

export const generateDashboardInsight = async (context: DashboardInsightContext): Promise<string> => {
    if (!API_KEY) {
        throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY trong file .env");
    }

    const rolePrompts: Record<string, string> = {
        'ROLE_USER': `Bạn là tư vấn viên nghề nghiệp IT. Dựa trên dữ liệu nền tảng:
- Có ${context.jobCount} việc làm IT đang tuyển
- Các công nghệ hot nhất: ${context.topTags?.join(', ')}
- Người dùng đã nộp ${context.cvCount} CV
${context.userProfile?.lookingfor ? `- Người dùng đang tìm kiếm: ${context.userProfile.lookingfor}` : ''}
${context.userProfile?.status ? `- Trạng thái: ${context.userProfile.status}` : ''}

Hãy đưa ra 3 lời khuyên ngắn gọn (mỗi ý 1-2 câu) giúp người dùng tối ưu hóa cơ hội tìm việc IT. Sử dụng emoji. Trả lời bằng tiếng Việt.`,

        'ROLE_COMPANY': `Bạn là chuyên gia tư vấn tuyển dụng IT. Dựa trên dữ liệu nền tảng:
- Hiện có ${context.jobCount} việc làm đang tuyển trên nền tảng
- Có ${context.companyCount} công ty đang hoạt động
- Các công nghệ được quan tâm nhất: ${context.topTags?.join(', ')}

Hãy đưa ra 3 lời khuyên ngắn gọn (mỗi ý 1-2 câu) giúp công ty tuyển dụng IT hiệu quả hơn. Sử dụng emoji. Trả lời bằng tiếng Việt.`,

        'ROLE_ADMIN': `Bạn là chuyên gia phân tích nền tảng tuyển dụng IT. Dựa trên dữ liệu:
- Tổng việc làm: ${context.jobCount}
- Tổng công ty: ${context.companyCount}
- Công nghệ trending: ${context.topTags?.join(', ')}

Hãy đưa ra 3 nhận xét ngắn gọn (mỗi ý 1-2 câu) về tình hình nền tảng và gợi ý phát triển. Sử dụng emoji. Trả lời bằng tiếng Việt.`
    };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = rolePrompts[context.role] || rolePrompts['ROLE_USER'];
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Lỗi khi tạo Dashboard Insight:", error);
        throw error;
    }
};
