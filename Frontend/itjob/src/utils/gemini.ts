import api from "./api";

interface InlineData {
    data: string;
    mimeType: string;
}

interface ChatTurn {
    role: 'user' | 'model';
    text: string;
}

// Gọi Gemini qua backend (POST /ai/generate) — API key chỉ nằm ở server, không lộ ra trình duyệt.
const generateText = async (prompt: string, inlineData?: InlineData, history?: ChatTurn[]): Promise<string> => {
    const res = await api.post<{ text: string }>('/ai/generate', { prompt, inlineData, history });
    return res.data.text;
};

const safeParseJSON = (text: string) => {
    try {
        // Tìm mảng hoặc object đầu tiên và cuối cùng
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        const startObj = text.indexOf('{');
        const endObj = text.lastIndexOf('}');
        
        let jsonStr = text;
        
        if (start !== -1 && end !== -1 && (startObj === -1 || start < startObj)) {
            jsonStr = text.substring(start, end + 1);
        } else if (startObj !== -1 && endObj !== -1) {
            jsonStr = text.substring(startObj, endObj + 1);
        }
        
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Lỗi parse JSON từ Gemini:", e, "Dữ liệu gốc:", text);
        throw e;
    }
};

export const generateCVSuggestion = async (promptText: string): Promise<string> => {

    try {

        const resultText = await generateText(promptText);
        return resultText;
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

// Backend giới hạn 40 lượt lịch sử, trừ 2 lượt mở đầu (system prompt + lời chào).
const MAX_CHAT_HISTORY_TURNS = 38;

export const chatWithAI = async (
    userMessage: string,
    history: ChatMessage[]
): Promise<string> => {
    try {
        const turns: ChatTurn[] = [
            { role: 'user', text: CHATBOT_SYSTEM_PROMPT },
            { role: 'model', text: 'Xin chào! 👋 Tôi là IT.JOB AI, trợ lý tư vấn nghề nghiệp IT của bạn. Tôi sẵn sàng hỗ trợ bạn!' },
            ...history.slice(-MAX_CHAT_HISTORY_TURNS).map(message => ({ role: message.role, text: message.parts[0].text })),
        ];
        return await generateText(userMessage, undefined, turns);
    } catch (error) {
        console.error("Lỗi khi gọi Gemini Chat API:", error);
        throw error;
    }
};

export const evaluateCVPDF = async (file: File): Promise<any> => {

    try {
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

        const resultText = await generateText(prompt, generativePart.inlineData);
        return safeParseJSON(resultText);
    } catch (error) {
        console.error("Lỗi khi đánh giá PDF:", error);
        throw error;
    }
};

// ===== AI INTERVIEW PREP =====
export const generateInterviewQuestions = async (
    jobTitle: string,
    jobTags: string[],
    jobPosition: string,
    companyName: string
): Promise<string> => {

    const prompt = `Bạn là chuyên gia phỏng vấn IT senior. Hãy tạo bộ câu hỏi phỏng vấn cho vị trí sau:

- Công việc: ${jobTitle}
- Công ty: ${companyName}
- Cấp bậc: ${jobPosition}
- Công nghệ: ${jobTags.join(', ')}

Hãy tạo 10 câu hỏi phỏng vấn chia theo 3 nhóm:
1. **Câu hỏi kỹ thuật** (5 câu) — liên quan trực tiếp đến ${jobTags.join(', ')}
2. **Câu hỏi tình huống** (3 câu) — xử lý tình huống thực tế
3. **Câu hỏi hành vi** (2 câu) — về kinh nghiệm và teamwork

Mỗi câu hỏi kèm gợi ý trả lời ngắn (1-2 câu). Sử dụng emoji. Trả lời bằng tiếng Việt.`;

    try {
        const resultText = await generateText(prompt);
        return resultText;
    } catch (error) {
        console.error("Lỗi AI Interview Prep:", error);
        throw error;
    }
};
