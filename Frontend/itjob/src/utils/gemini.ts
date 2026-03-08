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
