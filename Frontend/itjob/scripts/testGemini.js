import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ Không tìm thấy VITE_GEMINI_API_KEY trong file .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testGemini() {
    console.log("🚀 Đang thử kết nối tới Gemini API...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
Bạn là một chuyên gia Nhân sự (HR).
Ứng viên viết phần tóm tắt mục tiêu nghề nghiệp như sau: 
"Tôi muốn tìm môi trường năng động để học hỏi."

Hãy viết lại câu trên sao cho chuyên nghiệp, ấn tượng, tập trung vào giá trị đóng góp và ngắn gọn (dưới 30 từ).
`;
        console.log("Đang gửi Prompt test...");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ Kết nối thành công! Phản hồi từ Gemini:");
        console.log("-----------------------------------------");
        console.log(text);
        console.log("-----------------------------------------");
    } catch (error) {
        console.error("❌ Lỗi khi test Gemini API:", error.message);
    }
}

testGemini();
