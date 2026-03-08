import { useState } from "react";
import { FaDownload, FaMagic, FaPalette, FaFont, FaChevronLeft, FaSave, FaCheck, FaExclamationCircle } from "react-icons/fa";
import { Link } from "react-router";
import { suggestCVField } from "../../../../utils/gemini";

// Mock CV Data
const INITIAL_CV_DATA = {
    fullName: "Nguyễn Văn A",
    jobTitle: "Frontend Developer",
    email: "nguyenvana@gmail.com",
    phone: "0987654321",
    address: "Hà Nội, Việt Nam",
    summary: "Lập trình viên Frontend với 2 năm kinh nghiệm trong việc phát triển các ứng dụng web phức tạp sử dụng ReactJS và TypeScript.",
    experiences: [
        {
            company: "Tech Company Inc.",
            position: "Frontend Developer",
            duration: "01/2022 - Hiện tại",
            description: "- Phát triển và bảo trì các tính năng chính của sản phẩm.\n- Tối ưu hóa hiệu năng ứng dụng, giảm thời gian load 30%.\n- Phối hợp với team thiết kế để đảm bảo UI/UX tốt nhất."
        }
    ],
    education: [
        {
            school: "Đại học Bách Khoa Hà Nội",
            degree: "Cử nhân Công nghệ Thông tin",
            duration: "2018 - 2022"
        }
    ],
    skills: ["ReactJS", "TypeScript", "Tailwind CSS", "NodeJS"]
};

// Design settings state
const INITIAL_DESIGN = {
    font: "font-sans",
    color: "text-blue-600",
    bgColor: "bg-blue-600",
    spacing: "normal"
};

export default function CVBuilderPage() {
    const [cvData, setCvData] = useState(INITIAL_CV_DATA);
    const [design, setDesign] = useState(INITIAL_DESIGN);
    const [activeTab, setActiveTab] = useState("content"); // content, design
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAISuggest = async (field: 'summary' | 'exp' | 'skill', text: string) => {
        if (!text || text.trim() === '') {
            setAiSuggestion("Vui lòng nhập một ít nội dung vào ô text để AI có thể gợi ý!");
            return;
        }

        setIsAnalyzing(true);
        try {
            const suggestion = await suggestCVField(field, text);
            setAiSuggestion(suggestion);
        } catch (error: any) {
            console.error("Lỗi AI Suggest:", error);
            setAiSuggestion("Lỗi kết nối bộ AI: " + (error.message || "Vui lòng xem lại API Key."));
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">

            {/* LEFT PANEL: Editor */}
            <div className="w-1/2 flex flex-col bg-white border-r border-slate-200 z-10 shadow-xl">
                {/* Header */}
                <div className="h-16 flex border-b border-slate-200 items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard/cv/templates" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <FaChevronLeft />
                        </Link>
                        <div>
                            <h1 className="font-bold text-slate-800 leading-tight">Mẫu CV Chuyên Nghiệp</h1>
                            <span className="text-xs text-slate-500">Đã lưu 2 phút trước</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-indigo-200 text-indigo-700 bg-indigo-50 font-medium rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                            <FaMagic /> Auto-fill từ Job JD
                        </button>
                        <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
                            <FaSave /> Lưu
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <button
                        onClick={() => setActiveTab("content")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "content" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
                    >
                        Nội dung
                    </button>
                    <button
                        onClick={() => setActiveTab("design")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "design" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"}`}
                    >
                        <FaPalette /> Thiết kế
                    </button>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbars-hide">
                    {activeTab === "content" && (
                        <div className="space-y-8">
                            {/* Section: Personal Info */}
                            <section>
                                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Thông tin cá nhân</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Họ Tên</label>
                                        <input type="text" value={cvData.fullName} onChange={e => setCvData({ ...cvData, fullName: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vị trí ứng tuyển</label>
                                        <input type="text" value={cvData.jobTitle} onChange={e => setCvData({ ...cvData, jobTitle: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
                                        <input type="email" value={cvData.email} onChange={e => setCvData({ ...cvData, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                    </div>
                                </div>
                            </section>

                            {/* Section: Profile Summary */}
                            <section>
                                <div className="flex justify-between items-end mb-2 border-b border-slate-200 pb-2">
                                    <h2 className="text-lg font-bold text-slate-800">Giới thiệu bản thân</h2>
                                    <button onClick={() => handleAISuggest('summary', cvData.summary)} className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-pink-100 transition-colors">
                                        <FaMagic size={10} /> AI Gợi ý
                                    </button>
                                </div>

                                {aiSuggestion && (
                                    <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-3">
                                        <div className="text-indigo-500 mt-0.5"><FaExclamationCircle /></div>
                                        <div className="text-sm text-indigo-900 leading-relaxed pr-6">{aiSuggestion}</div>
                                        <button onClick={() => setAiSuggestion(null)} className="ml-auto text-indigo-400 hover:text-indigo-700">×</button>
                                    </div>
                                )}

                                <textarea
                                    value={cvData.summary}
                                    onChange={e => setCvData({ ...cvData, summary: e.target.value })}
                                    rows={4}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </section>

                            {/* Section: Experience */}
                            <section>
                                <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
                                    <h2 className="text-lg font-bold text-slate-800">Kinh nghiệm làm việc</h2>
                                    <button className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                                        + Thêm kinh nghiệm
                                    </button>
                                </div>

                                {cvData.experiences.map((exp, idx) => (
                                    <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                                        <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Công ty</label>
                                                <input type="text" value={exp.company} className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white" readOnly />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Vị trí</label>
                                                <input type="text" value={exp.position} className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white" readOnly />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="block text-xs font-semibold text-slate-500">Mô tả công việc</label>
                                                <button onClick={() => handleAISuggest('exp', exp.description)} className="text-[10px] font-medium text-pink-600 flex items-center gap-1 hover:underline">
                                                    <FaMagic size={8} /> Gợi ý viết chuẩn
                                                </button>
                                            </div>
                                            <textarea value={exp.description} rows={3} className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white" readOnly />
                                        </div>
                                    </div>
                                ))}
                            </section>
                        </div>
                    )}

                    {activeTab === "design" && (
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FaFont /> Phông chữ</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setDesign({ ...design, font: 'font-sans' })} className={`p-3 border rounded-lg text-left ${design.font === 'font-sans' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <span className="font-sans font-medium">Inter (Khuyên dùng)</span>
                                    </button>
                                    <button onClick={() => setDesign({ ...design, font: 'font-serif' })} className={`p-3 border rounded-lg text-left ${design.font === 'font-serif' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <span className="font-serif font-medium">Merriweather</span>
                                    </button>
                                    <button onClick={() => setDesign({ ...design, font: 'font-mono' })} className={`p-3 border rounded-lg text-left ${design.font === 'font-mono' ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <span className="font-mono font-medium">Roboto Mono</span>
                                    </button>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FaPalette /> Màu chủ đạo</h3>
                                <div className="flex gap-3">
                                    {['bg-blue-600', 'bg-emerald-600', 'bg-neutral-800', 'bg-violet-600', 'bg-rose-600'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setDesign({ ...design, bgColor: color, color: color.replace('bg-', 'text-') })}
                                            className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white ring-offset-2 transition-all ${design.bgColor === color ? 'ring-2 ring-indigo-600 scale-110' : 'hover:scale-105 shadow-sm'}`}
                                        >
                                            {design.bgColor === color && <FaCheck size={12} />}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-slate-800 mb-3">Khoảng cách & Dãn dòng</h3>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => setDesign({ ...design, spacing: 'compact' })} className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${design.spacing === 'compact' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Gọn gàng</button>
                                    <button onClick={() => setDesign({ ...design, spacing: 'normal' })} className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${design.spacing === 'normal' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Tiêu chuẩn</button>
                                    <button onClick={() => setDesign({ ...design, spacing: 'loose' })} className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${design.spacing === 'loose' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Rộng rãi</button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Live Preview A4 */}
            <div className="w-1/2 bg-slate-200 flex flex-col relative overflow-hidden">
                {/* Toolbar preview */}
                <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-4 pointer-events-auto shadow-xl">
                        <span>Preview: 100%</span>
                        <div className="w-px h-4 bg-white/20"></div>
                        <button className="hover:text-indigo-300 transition-colors flex items-center gap-2">
                            <FaDownload /> Tải PDF (A4)
                        </button>
                    </div>
                </div>

                {/* The CV Paper */}
                <div className="flex-1 overflow-y-auto p-12 flex justify-center items-start">
                    <div
                        className={`bg-white shadow-2xl w-[210mm] min-h-[297mm] h-auto p-0 flex flex-col ${design.font}`}
                        style={{ transformOrigin: 'top center', scale: '0.8' }}
                    >
                        {/* Header CV */}
                        <div className={`p-8 pb-6 flex justify-between items-end border-b-4 border-l-8`} style={{ borderColor: 'var(--theme-color)', borderLeftColor: 'var(--theme-color)' }}>
                            <div className={`absolute top-0 left-0 w-2 h-full ${design.bgColor}`}></div>
                            <div>
                                <h1 className={`text-4xl font-black uppercase tracking-tight text-slate-900 mb-1`}>{cvData.fullName}</h1>
                                <h2 className={`text-xl font-semibold tracking-wide ${design.color}`}>{cvData.jobTitle}</h2>
                            </div>
                            <div className="text-right text-xs text-slate-600 space-y-1">
                                <p>{cvData.phone}</p>
                                <p>{cvData.email}</p>
                                <p>{cvData.address}</p>
                            </div>
                        </div>

                        {/* Layout Content CV */}
                        <div className="flex px-8 py-6 gap-8 h-full">
                            {/* Left Column CV */}
                            <div className="w-2/3 space-y-6">
                                <div>
                                    <h3 className={`text-lg font-bold uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 ${design.color}`}>Tóm tắt</h3>
                                    <p className={`text-sm text-slate-700 leading-relaxed ${design.spacing === 'loose' ? 'leading-loose' : design.spacing === 'compact' ? 'leading-snug' : ''}`}>{cvData.summary}</p>
                                </div>

                                <div>
                                    <h3 className={`text-lg font-bold uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 ${design.color}`}>Kinh nghiệm</h3>
                                    {cvData.experiences.map((exp, idx) => (
                                        <div key={idx} className="mb-4">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-bold text-slate-800">{exp.position}</h4>
                                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{exp.duration}</span>
                                            </div>
                                            <div className={`font-semibold text-sm mb-2 ${design.color}`}>{exp.company}</div>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column CV */}
                            <div className="w-1/3 space-y-6">
                                <div>
                                    <h3 className={`text-lg font-bold uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 ${design.color}`}>Học vấn</h3>
                                    {cvData.education.map((edu, idx) => (
                                        <div key={idx} className="mb-3">
                                            <h4 className="font-bold text-slate-800 text-sm">{edu.degree}</h4>
                                            <div className="text-sm text-slate-600 my-0.5">{edu.school}</div>
                                            <div className={`text-xs font-medium uppercase ${design.color}`}>{edu.duration}</div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h3 className={`text-lg font-bold uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 ${design.color}`}>Kỹ năng</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cvData.skills.map((skill, idx) => (
                                            <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-sm font-medium border border-slate-200">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
