import { useState, useEffect, useRef } from 'react'
import {
    FaDownload,
    FaMagic,
    FaPalette,
    FaFont,
    FaChevronLeft,
    FaSave,
    FaCheck,
    FaExclamationCircle,
    FaSpinner,
    FaUndo,
} from 'react-icons/fa'
import { Link, useSearchParams } from 'react-router'
import { suggestCVField } from '@/utils/gemini'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import CVPreview from '@/components/cv/CVPreview'

// Mock CV Data
const INITIAL_CV_DATA = {
    fullName: 'Nguyễn Văn A',
    jobTitle: 'Frontend Developer',
    email: 'nguyenvana@gmail.com',
    phone: '0987654321',
    address: 'Hà Nội, Việt Nam',
    summary:
        'Lập trình viên Frontend với 2 năm kinh nghiệm trong việc phát triển các ứng dụng web phức tạp sử dụng ReactJS và TypeScript.',
    experiences: [
        {
            company: 'Tech Company Inc.',
            position: 'Frontend Developer',
            duration: '01/2022 - Hiện tại',
            description:
                '- Phát triển và bảo trì các tính năng chính của sản phẩm.\n- Tối ưu hóa hiệu năng ứng dụng, giảm thời gian load 30%.\n- Phối hợp với team thiết kế để đảm bảo UI/UX tốt nhất.',
        },
    ],
    education: [
        {
            school: 'Đại học Bách Khoa Hà Nội',
            degree: 'Cử nhân Công nghệ Thông tin',
            duration: '2018 - 2022',
        },
    ],
    skills: ['ReactJS', 'TypeScript', 'Tailwind CSS', 'NodeJS'],
}

// Design settings state
const INITIAL_DESIGN = {
    font: '!font-inter',
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    spacing: 'normal',
}

export default function CVBuilderPage() {
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('template') || 'default';
    
    const [cvData, setCvData] = useState(INITIAL_CV_DATA)
    const [design, setDesign] = useState(INITIAL_DESIGN)
    const [activeTab, setActiveTab] = useState('content') // content, design
    const [isSaved, setIsSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState<number | null>(null);
    const [timeAgo, setTimeAgo] = useState<string>("");
    const [isDownloading, setIsDownloading] = useState(false);
    const cvPreviewRef = useRef<HTMLDivElement>(null);

    // Helper to format relative time
    const getRelativeTime = (timestamp: number | null) => {
        if (!timestamp) return "";
        const now = Date.now();
        const diffInSeconds = Math.floor((now - timestamp) / 1000);
        
        if (diffInSeconds < 60) return "vừa xong";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        return new Date(timestamp).toLocaleDateString("vi-VN");
    };

    // Periodically update the "time ago" string
    useEffect(() => {
        const updateTime = () => setTimeAgo(getRelativeTime(lastSaved));
        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [lastSaved]);

    // Load data from Local Storage on mount
    useEffect(() => {
        const savedData = localStorage.getItem(`cv_data_${templateId}`);
        const savedDesign = localStorage.getItem(`cv_design_${templateId}`);
        const savedTime = localStorage.getItem(`cv_last_saved_${templateId}`);
        
        if (savedData) {
            try {
                setCvData(JSON.parse(savedData));
            } catch (e) {
                console.error("Error parsing saved CV data", e);
            }
        }
        
        if (savedDesign) {
            try {
                setDesign(JSON.parse(savedDesign));
            } catch (e) {
                console.error("Error parsing saved design data", e);
            }
        }

        if (savedTime) {
            setLastSaved(parseInt(savedTime));
        }
    }, [templateId]);

    const handleSave = () => {
        const now = Date.now();
        localStorage.setItem(`cv_data_${templateId}`, JSON.stringify(cvData));
        localStorage.setItem(`cv_design_${templateId}`, JSON.stringify(design));
        localStorage.setItem(`cv_last_saved_${templateId}`, now.toString());
        setLastSaved(now);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleReset = () => {
        if (window.confirm("Bạn có chắc chắn muốn đặt lại toàn bộ thông tin về mặc định? Hành động này sẽ xóa dữ liệu đã lưu cho mẫu này.")) {
            localStorage.removeItem(`cv_data_${templateId}`);
            localStorage.removeItem(`cv_design_${templateId}`);
            localStorage.removeItem(`cv_last_saved_${templateId}`);
            setCvData(INITIAL_CV_DATA);
            setDesign(INITIAL_DESIGN);
            setLastSaved(null);
            setIsSaved(false);
        }
    };

    const handleDownloadPDF = async () => {
    if (!cvPreviewRef.current) return;
    
    setIsDownloading(true);
    try {
        const element = cvPreviewRef.current;
        
        // Dùng html-to-image để chụp ảnh. 
        // Thêm thuộc tính style để ép scale về 1 lúc chụp, giúp ảnh nét cứng và không bị lệch
        const dataUrl = await toPng(element, {
            quality: 1,
            pixelRatio: 2, // Tăng độ nét gấp đôi (giống scale: 2 của html2canvas)
            backgroundColor: '#ffffff',
            skipFonts: true,
            style: {
                transform: 'scale(1)', // Ép bỏ scale 0.8 lúc chụp
                transformOrigin: 'top left',
            }
        });
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        // Tính toán chiều cao tương ứng với tỷ lệ của tờ A4
        const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${cvData.fullName || 'User'} - CV.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Có lỗi xảy ra khi tải PDF. Vui lòng thử lại.");
    } finally {
        setIsDownloading(false);
    }
};

    // Per-field AI suggestion state
    const [aiSuggestions, setAiSuggestions] = useState<
        Record<string, string | null>
    >({})
    const [loadingField, setLoadingField] = useState<string | null>(null)

    const handleAISuggest = async (
        field: 'summary' | 'exp' | 'skill',
        text: string,
        fieldKey?: string
    ) => {
        const key = fieldKey || field
        if (!text || text.trim() === '') {
            setAiSuggestions((prev) => ({
                ...prev,
                [key]: 'Vui lòng nhập một ít nội dung vào ô text để AI có thể gợi ý!',
            }))
            return
        }

        setLoadingField(key)
        try {
            const suggestion = await suggestCVField(field, text)
            setAiSuggestions((prev) => ({ ...prev, [key]: suggestion }))
        } catch (error: any) {
            console.error('Lỗi AI Suggest:', error)
            setAiSuggestions((prev) => ({
                ...prev,
                [key]:
                    'Lỗi kết nối bộ AI: ' +
                    (error.message || 'Vui lòng xem lại API Key.'),
            }))
        } finally {
            setLoadingField(null)
        }
    }

    const handleApplySuggestion = (fieldKey: string) => {
        const suggestion = aiSuggestions[fieldKey]
        if (!suggestion) return

        if (fieldKey === 'summary') {
            setCvData((prev) => ({ ...prev, summary: suggestion }))
        } else if (fieldKey.startsWith('exp_')) {
            const idx = parseInt(fieldKey.replace('exp_', ''))
            setCvData((prev) => ({
                ...prev,
                experiences: prev.experiences.map((exp, i) =>
                    i === idx ? { ...exp, description: suggestion } : exp
                ),
            }))
        } else if (fieldKey === 'skill') {
            // Parse the AI suggestion into skill items (split by comma, newline, or bullet points)
            const newSkills = suggestion
                .split(/[,\n•\-]+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0 && s.length < 50)
            if (newSkills.length > 0) {
                setCvData((prev) => ({ ...prev, skills: newSkills }))
            }
        }

        // Clear the suggestion after applying
        setAiSuggestions((prev) => ({ ...prev, [fieldKey]: null }))
    }

    const dismissSuggestion = (fieldKey: string) => {
        setAiSuggestions((prev) => ({ ...prev, [fieldKey]: null }))
    }

    const renderSuggestionBox = (fieldKey: string) => {
        const suggestion = aiSuggestions[fieldKey]
        if (!suggestion) return null

        return (
            <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-indigo-500">
                        <FaExclamationCircle />
                    </div>
                    <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap text-indigo-900">
                        {suggestion}
                    </div>
                    <button
                        onClick={() => dismissSuggestion(fieldKey)}
                        className="flex-shrink-0 text-indigo-400 hover:text-indigo-700"
                    >
                        ×
                    </button>
                </div>
                <div className="mt-3 ml-7 flex gap-2">
                    <button
                        onClick={() => handleApplySuggestion(fieldKey)}
                        className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        <FaCheck size={10} /> Áp dụng gợi ý
                    </button>
                    <button
                        onClick={() => dismissSuggestion(fieldKey)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        Bỏ qua
                    </button>
                </div>
            </div>
        )
    }

    const renderAIButton = (
        field: 'summary' | 'exp' | 'skill',
        text: string,
        fieldKey?: string,
        label?: string
    ) => {
        const key = fieldKey || field
        const isLoading = loadingField === key

        return (
            <button
                onClick={() => handleAISuggest(field, text, fieldKey)}
                disabled={isLoading}
                className={`flex items-center gap-1 rounded-md bg-pink-50 px-2 py-1 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-100 ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
            >
                {isLoading ? (
                    <FaSpinner size={10} className="animate-spin" />
                ) : (
                    <FaMagic size={10} />
                )}
                {label || 'AI Gợi ý'}
            </button>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
            {/* LEFT PANEL: Editor */}
            <div className="z-10 flex w-1/2 flex-col border-r border-slate-200 bg-white shadow-xl">
                {/* Header */}
                <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/cv/templates"
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            <FaChevronLeft />
                        </Link>
                        <div>
                            <h1 className="leading-tight font-bold text-slate-800">
                                Mẫu CV Chuyên Nghiệp
                            </h1>
                            <span className="text-xs text-slate-500">
                                {isSaved ? (
                                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                        <FaCheck size={10} /> Đã lưu vào trình duyệt
                                    </span>
                                ) : (
                                    lastSaved ? `Đã lưu ${timeAgo}` : "Chưa lưu thay đổi"
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={handleReset}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-600"
                        >
                            <FaUndo /> Đặt về mặc định
                        </button>
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
                        >
                            {isDownloading ? <FaSpinner className="animate-spin" /> : <FaDownload />} 
                            {isDownloading ? "Đang tạo..." : "Tải PDF"}
                        </button>
                        <button 
                            onClick={handleSave}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${isSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                            {isSaved ? <FaCheck /> : <FaSave />} {isSaved ? "Đã lưu" : "Lưu"}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${activeTab === 'content' ? 'border-indigo-600 bg-white text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                    >
                        Nội dung
                    </button>
                    <button
                        onClick={() => setActiveTab('design')}
                        className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${activeTab === 'design' ? 'border-indigo-600 bg-white text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                    >
                        <FaPalette /> Thiết kế
                    </button>
                </div>

                {/* Editor Content Area */}
                <div className="scrollbars-hide flex-1 overflow-y-auto p-6">
                    {activeTab === 'content' && (
                        <div className="space-y-8">
                            {/* Section: Personal Info */}
                            <section>
                                <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800">
                                    Thông tin cá nhân
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase">
                                            Họ Tên
                                        </label>
                                        <input
                                            type="text"
                                            value={cvData.fullName}
                                            onChange={(e) =>
                                                setCvData({
                                                    ...cvData,
                                                    fullName: e.target.value,
                                                })
                                            }
                                            className="line-clamp-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase">
                                            Vị trí ứng tuyển
                                        </label>
                                        <input
                                            type="text"
                                            value={cvData.jobTitle}
                                            onChange={(e) =>
                                                setCvData({
                                                    ...cvData,
                                                    jobTitle: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={cvData.email}
                                            onChange={(e) =>
                                                setCvData({
                                                    ...cvData,
                                                    email: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section: Profile Summary */}
                            <section>
                                <div className="mb-2 flex items-end justify-between border-b border-slate-200 pb-2">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Giới thiệu bản thân
                                    </h2>
                                    {renderAIButton('summary', cvData.summary)}
                                </div>

                                {renderSuggestionBox('summary')}

                                <textarea
                                    value={cvData.summary}
                                    onChange={(e) =>
                                        setCvData({
                                            ...cvData,
                                            summary: e.target.value,
                                        })
                                    }
                                    rows={4}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </section>

                            {/* Section: Experience */}
                            <section>
                                <div className="mb-4 flex items-end justify-between border-b border-slate-200 pb-2">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Kinh nghiệm làm việc
                                    </h2>
                                    <button className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100">
                                        + Thêm kinh nghiệm
                                    </button>
                                </div>

                                {cvData.experiences.map((exp, idx) => (
                                    <div
                                        key={idx}
                                        className="group relative mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <button className="absolute top-2 right-2 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500">
                                            ×
                                        </button>
                                        <div className="mb-3 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-slate-500">
                                                    Công ty
                                                </label>
                                                <input
                                                    type="text"
                                                    value={exp.company}
                                                    onChange={(e) => {
                                                        const newExps = [
                                                            ...cvData.experiences,
                                                        ]
                                                        newExps[idx] = {
                                                            ...newExps[idx],
                                                            company:
                                                                e.target.value,
                                                        }
                                                        setCvData({
                                                            ...cvData,
                                                            experiences:
                                                                newExps,
                                                        })
                                                    }}
                                                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-slate-500">
                                                    Vị trí
                                                </label>
                                                <input
                                                    type="text"
                                                    value={exp.position}
                                                    onChange={(e) => {
                                                        const newExps = [
                                                            ...cvData.experiences,
                                                        ]
                                                        newExps[idx] = {
                                                            ...newExps[idx],
                                                            position:
                                                                e.target.value,
                                                        }
                                                        setCvData({
                                                            ...cvData,
                                                            experiences:
                                                                newExps,
                                                        })
                                                    }}
                                                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-1 flex justify-between">
                                                <label className="block text-xs font-semibold text-slate-500">
                                                    Mô tả công việc
                                                </label>
                                                {renderAIButton(
                                                    'exp',
                                                    exp.description,
                                                    `exp_${idx}`,
                                                    'Gợi ý viết chuẩn'
                                                )}
                                            </div>
                                            {renderSuggestionBox(`exp_${idx}`)}
                                            <textarea
                                                value={exp.description}
                                                onChange={(e) => {
                                                    const newExps = [
                                                        ...cvData.experiences,
                                                    ]
                                                    newExps[idx] = {
                                                        ...newExps[idx],
                                                        description:
                                                            e.target.value,
                                                    }
                                                    setCvData({
                                                        ...cvData,
                                                        experiences: newExps,
                                                    })
                                                }}
                                                rows={3}
                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </section>

                            {/* Section: Skills */}
                            <section>
                                <div className="mb-2 flex items-end justify-between border-b border-slate-200 pb-2">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Kỹ năng
                                    </h2>
                                    {renderAIButton(
                                        'skill',
                                        cvData.skills.join(', '),
                                        'skill',
                                        'AI Phân loại'
                                    )}
                                </div>

                                {renderSuggestionBox('skill')}

                                <div className="mb-3 flex flex-wrap gap-2">
                                    {cvData.skills.map((skill, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5"
                                        >
                                            <input
                                                type="text"
                                                value={skill}
                                                onChange={(e) => {
                                                    const newSkills = [
                                                        ...cvData.skills,
                                                    ]
                                                    newSkills[idx] =
                                                        e.target.value
                                                    setCvData({
                                                        ...cvData,
                                                        skills: newSkills,
                                                    })
                                                }}
                                                className="w-24 border-none bg-transparent text-sm font-medium text-slate-700 outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newSkills =
                                                        cvData.skills.filter(
                                                            (_, i) => i !== idx
                                                        )
                                                    setCvData({
                                                        ...cvData,
                                                        skills: newSkills,
                                                    })
                                                }}
                                                className="text-xs text-slate-400 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            setCvData({
                                                ...cvData,
                                                skills: [...cvData.skills, ''],
                                            })
                                        }
                                        className="rounded-lg border-2 border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
                                    >
                                        + Thêm
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'design' && (
                        <div className="space-y-6">
                            <section>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                                    <FaFont /> Phông chữ
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() =>
                                            setDesign({
                                                ...design,
                                                font: '!font-inter',
                                            })
                                        }
                                        className={`rounded-lg border p-3 text-left ${design.font === '!font-inter' ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <span className="!font-inter font-medium">
                                            Inter (Khuyên dùng)
                                        </span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setDesign({
                                                ...design,
                                                font: '!font-merriweather',
                                            })
                                        }
                                        className={`rounded-lg border p-3 text-left ${design.font === '!font-merriweather' ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <span className="!font-merriweather font-medium">
                                            Merriweather
                                        </span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setDesign({
                                                ...design,
                                                font: '!font-roboto-mono',
                                            })
                                        }
                                        className={`rounded-lg border p-3 text-left ${design.font === '!font-roboto-mono' ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <span className="!font-roboto-mono font-medium">
                                            Roboto Mono
                                        </span>
                                    </button>
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                                    <FaPalette /> Màu chủ đạo
                                </h3>
                                <div className="flex gap-3">
                                    {[
                                        'bg-blue-600',
                                        'bg-emerald-600',
                                        'bg-neutral-800',
                                        'bg-violet-600',
                                        'bg-rose-600',
                                    ].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() =>
                                                setDesign({
                                                    ...design,
                                                    bgColor: color,
                                                    color: color.replace(
                                                        'bg-',
                                                        'text-'
                                                    ),
                                                })
                                            }
                                            className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white ring-offset-2 transition-all ${design.bgColor === color ? 'scale-110 ring-2 ring-indigo-600' : 'shadow-sm hover:scale-105'}`}
                                        >
                                            {design.bgColor === color && (
                                                <FaCheck size={12} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-3 text-sm font-bold text-slate-800">
                                    Khoảng cách & Dãn dòng
                                </h3>
                                <div className="flex rounded-lg bg-slate-100 p-1">
                                    <button
                                        onClick={() =>
                                            setDesign({
                                                ...design,
                                                spacing: 'compact',
                                            })
                                        }
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${design.spacing === 'compact' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Gọn gàng
                                    </button>
                                    <button
                                        onClick={() =>
                                            setDesign({
                                                ...design,
                                                spacing: 'normal',
                                            })
                                        }
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${design.spacing === 'normal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Tiêu chuẩn
                                    </button>
                                    <button
                                        onClick={() =>
                                            setDesign({
                                                ...design,
                                                spacing: 'loose',
                                            })
                                        }
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${design.spacing === 'loose' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Rộng rãi
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Live Preview A4 */}
            <div className="relative flex w-1/2 flex-col overflow-hidden bg-slate-200">
                {/* Toolbar preview */}
                <div className="pointer-events-none absolute top-4 right-0 left-0 z-10 flex justify-center">
                    <div className="pointer-events-auto flex items-center gap-4 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur">
                        <span>Preview: 100%</span>
                        <div className="h-4 w-px bg-white/20"></div>
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isDownloading}
                            className="flex items-center gap-2 transition-colors hover:text-indigo-300 disabled:opacity-50"
                        >
                            {isDownloading ? <FaSpinner className="animate-spin" /> : <FaDownload />} Tải PDF (A4)
                        </button>
                    </div>
                </div>

                {/* The CV Paper */}
                <div className="flex flex-1 items-start justify-center overflow-y-auto p-12">
                    <CVPreview 
                        cvData={cvData} 
                        design={design} 
                        previewRef={cvPreviewRef} 
                    />
                </div>
            </div>
        </div>
    )
}