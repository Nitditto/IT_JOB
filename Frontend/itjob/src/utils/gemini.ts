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

// ===== AI JOB MATCH SCORE =====
export interface JobMatchResult {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    advice: string[];
}

export const analyzeJobMatch = async (
    userSkills: string[],
    userPosition: string,
    jobTitle: string,
    jobTags: string[],
    jobPosition: string,
    jobWorkstyle: string
): Promise<JobMatchResult> => {
    if (!API_KEY) throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY");

    const prompt = `Bạn là chuyên gia tuyển dụng IT. Hãy phân tích mức độ phù hợp giữa ứng viên và công việc.

Thông tin ứng viên:
- Kỹ năng: ${userSkills.length > 0 ? userSkills.join(', ') : 'Chưa cập nhật'}
- Vị trí hiện tại: ${userPosition || 'Chưa cập nhật'}

Thông tin công việc:
- Tên công việc: ${jobTitle}
- Yêu cầu kỹ năng: ${jobTags.join(', ')}
- Cấp bậc: ${jobPosition}
- Hình thức: ${jobWorkstyle}

Trả về JSON hợp lệ (không markdown wrap):
{
  "score": <số 0-100>,
  "matchingSkills": ["kỹ năng trùng khớp"],
  "missingSkills": ["kỹ năng thiếu"],
  "advice": ["lời khuyên 1", "lời khuyên 2", "lời khuyên 3"]
}
Chỉ trả về JSON, viết bằng tiếng Việt.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Lỗi AI Job Match:", error);
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
    if (!API_KEY) throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY");

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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Lỗi AI Interview Prep:", error);
        throw error;
    }
};

// ===== AI SMART SEARCH SUGGESTIONS =====
export const getSmartSearchSuggestions = async (
    naturalQuery: string,
    availableTags: string[]
): Promise<string[]> => {
    if (!API_KEY) throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY");

    const prompt = `Bạn là trợ lý tìm việc IT thông minh. Người dùng nhập: "${naturalQuery}"

Danh sách công nghệ có trên nền tảng: ${availableTags.join(', ')}

Hãy gợi ý 4-5 từ khóa tìm kiếm liên quan, dựa trên ngữ cảnh IT Việt Nam.
Trả về JSON array các string, ví dụ: ["React Developer", "Frontend", "JavaScript"]
Chỉ trả về JSON array, không giải thích.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Lỗi AI Smart Search:", error);
        return [];
    }
};

// ===== AI MARKET COMPANIES =====
export interface MarketCompany {
    name: string;
    industry: string;
    techStack: string[];
    employees: string;
    hiringStatus: string;
    website: string;
    description: string;
}

export const fetchMarketCompanies = async (): Promise<MarketCompany[]> => {
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem('market_companies');
    if (cached) {
        try { return JSON.parse(cached); } catch { /* ignore */ }
    }

    if (!API_KEY) throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY");

    const prompt = `Bạn là chuyên gia thị trường IT Việt Nam. Hãy liệt kê 12 công ty công nghệ hàng đầu tại Việt Nam đang tuyển dụng nhiều nhất.

Bao gồm cả công ty Việt Nam (FPT, VNG, Zalo, Tiki, MoMo, Momo, VNPay, Sendo...) và công ty quốc tế có văn phòng tại VN (Samsung, Bosch, Axon, NashTech, KMS, TMA...).

Trả về JSON array (không markdown wrap), mỗi object có:
{
  "name": "Tên công ty",
  "industry": "Lĩnh vực (vd: Fintech, E-commerce, AI, Cloud...)",
  "techStack": ["React", "Java", "Python"],
  "employees": "1000-5000",
  "hiringStatus": "Đang tuyển 50+ vị trí" hoặc "Đang tuyển mạnh",
  "website": "https://...",
  "description": "Mô tả ngắn 1 câu"
}
Chỉ trả về JSON array.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const companies = JSON.parse(text);
        sessionStorage.setItem('market_companies', JSON.stringify(companies));
        return companies;
    } catch (error) {
        console.error("Lỗi fetch market companies:", error);
        return [];
    }
};

// ===== AI SALARY INSIGHTS =====
export interface SalaryInsight {
    position: string;
    techStack: string;
    minSalary: number;
    maxSalary: number;
    avgSalary: number;
    demand: string;
}

export const generateSalaryInsights = async (): Promise<SalaryInsight[]> => {
    const cached = sessionStorage.getItem('salary_insights');
    if (cached) {
        try { return JSON.parse(cached); } catch { /* ignore */ }
    }

    if (!API_KEY) throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY");

    const prompt = `Bạn là chuyên gia lương IT Việt Nam. Hãy cung cấp dữ liệu lương cho 8 vị trí IT phổ biến nhất.

Trả về JSON array (không markdown wrap), mỗi object:
{
  "position": "Frontend Developer",
  "techStack": "React, TypeScript",
  "minSalary": 500,
  "maxSalary": 3000,
  "avgSalary": 1500,
  "demand": "Rất cao"
}
Salary là USD/tháng. Bao gồm: Frontend, Backend, Fullstack, DevOps, Data Engineer, Mobile, QA/Tester, AI/ML.
Chỉ trả về JSON array.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);
        sessionStorage.setItem('salary_insights', JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("Lỗi AI Salary Insights:", error);
        return [];
    }
};

// ===== AI JOB RECOMMENDATIONS =====
export const getJobRecommendations = async (
    userSkills: string,
    userLocation: string,
    jobs: Array<{ id: number; name: string; tags: string[]; position: string; minSalary: number; maxSalary: number; company: string }>
): Promise<Array<{ jobId: number; reason: string }>> => {
    if (!API_KEY) throw new Error("Vui lòng cấu hình VITE_GEMINI_API_KEY");

    const jobList = jobs.slice(0, 20).map(j =>
        `ID:${j.id} | ${j.name} | ${j.tags.join(',')} | ${j.position} | ${j.minSalary}-${j.maxSalary}$ | ${j.company}`
    ).join('\n');

    const prompt = `Bạn là AI tuyển dụng. Hãy chọn 4 công việc phù hợp nhất cho ứng viên.

Ứng viên:
- Kỹ năng/mong muốn: ${userSkills || 'Chưa cập nhật'}
- Khu vực: ${userLocation || 'Cả nước'}

Danh sách việc:
${jobList}

Trả về JSON array (không markdown wrap):
[{"jobId": 123, "reason": "Lý do ngắn gọn bằng tiếng Việt"}]
Chỉ trả về JSON array.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Lỗi AI Job Recommendations:", error);
        return [];
    }
};
