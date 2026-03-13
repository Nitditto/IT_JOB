import { useState } from 'react'
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
} from 'react-icons/fa'
import { Link } from 'react-router'
import { suggestCVField } from '@/utils/gemini'

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
    const [cvData, setCvData] = useState(INITIAL_CV_DATA)
    const [design, setDesign] = useState(INITIAL_DESIGN)
    const [activeTab, setActiveTab] = useState('content') // content, design

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
                            to="/dashboard/cv/templates"
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            <FaChevronLeft />
                        </Link>
                        <div>
                            <h1 className="leading-tight font-bold text-slate-800">
                                Mẫu CV Chuyên Nghiệp
                            </h1>
                            <span className="text-xs text-slate-500">
                                Đã lưu 2     phút trước
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100">
                            <FaMagic /> Auto-fill từ Job Description
                        </button>
                        <button className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                            <FaSave /> Lưu
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
                                    <div className="cols-span-1">
                                        <label className="mb-1 block text-xs font-extrabold text-slate-600 uppercase">
                                            Số điện thoại
                                        </label>
                                        <input 
                                            type='text'
                                            value={cvData.phone}
                                            onChange={(e) => 
                                                setCvData({...cvData,
                                                    phone: e.target.value
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus-outline-none"
                                        />
                                        
                                    </div>
                                    <div className="cols-span-1">
                                        <label className="mb-1 block text-xs font-extrabold text-slate-600 uppercase">
                                            Địa chỉ                                        
                                        </label>
                                        <input 
                                            type='text'
                                            value={cvData.address}
                                            onChange={(e) => 
                                                setCvData({...cvData,
                                                    address: e.target.value
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus-outline-none"
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
                                <div className="cols-span-2">
                                    <label className="mb-4 flex items-end justify-between border-b border-slate-200 pb-2">
                                        Học Vấn
                                        
                                    </label>
                                    <button
                                            onClick={() =>
                                                setCvData({
                                                ...cvData,
                                                education: [
                                                    ...cvData.education,
                                                    {
                                                    school: "",
                                                    degree: "",
                                                    duration: ""
                                                    }
                                                ]
                                                })
                                            }
                                            className="right-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100"
                                        >
                                        + Thêm học vấn
                                    </button>
                                    {cvData.education.map((edu, idx) => (
                                        <div key={idx} className="mb-4 grid rounded-lg grid-cols-2 gap-3 bg-slate-50 p-4">
                                            <input
                                            type="text"
                                            value={edu.school}
                                            onChange={(e) => {
                                                const newEdu = [...cvData.education];
                                                newEdu[idx].school = e.target.value;
                                                setCvData({...cvData, education: newEdu});
                                            }}
                                            className='border border-slate-300 rounded px-3 py-2 text-sm'
                                            />
                                            <input 
                                                type="text"
                                                value={edu.degree}
                                                onChange={(e) => {
                                                    const newEdu = [...cvData.education];
                                                    newEdu[idx].degree = e.target.value;
                                                    setCvData({...cvData, education: newEdu});
                                                }}
                                                className="border border-slate-300 rounded px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={edu.duration}
                                                onChange={(e) => {
                                                    const newEdu = [...cvData.education];
                                                    newEdu[idx].duration = e.target.value;
                                                    setCvData({...cvData, education: newEdu});
                                                }}
                                                className='border border-slate-400 rounded px-3 py-2 text-sm'
                                            />
                                        </div>
                                    
                                    ))}

                                </div>
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
                                    <button
                                        onClick={() =>
                                            setCvData({
                                            ...cvData,
                                            experiences: [
                                                ...cvData.experiences,
                                                {
                                                company: "",
                                                position: "",
                                                duration: "",
                                                description: ""
                                                }
                                            ]
                                            })
                                        }
                                        className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                                        >
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
                        <button className="flex items-center gap-2 transition-colors hover:text-indigo-300">
                            <FaDownload /> Tải PDF (A4)
                        </button>
                    </div>
                </div>

                {/* The CV Paper */}
                <div className="flex flex-1 items-start justify-center overflow-y-auto p-12">
                    <div
                        className={`flex h-auto min-h-[297mm] w-[210mm] flex-col bg-white p-0 shadow-2xl ${design.font}`}
                        style={{ transformOrigin: 'top center', scale: '0.8' }}
                    >
                        {/* Header CV */}
                        <div
                            className={`relative flex items-end justify-between p-8 pb-6`}
                            style={{
                                borderColor: 'var(--theme-color)',
                                borderLeftColor: 'var(--theme-color)',
                            }}
                        >
                            <div
                                className={`absolute top-0 left-0 h-full w-2 ${design.bgColor}`}
                            ></div>
                            <div>
                                <h1
                                    className={`mb-1 text-4xl font-black py-2 text-slate-900 uppercase overflow-hidden h-fit text-wrap w-[450px] text-clip`}
                                >
                                    {cvData.fullName}
                                </h1>
                                <h2
                                    className={`text-xl font-semibold tracking-wide ${design.color}`}
                                >
                                    {cvData.jobTitle}
                                </h2>
                            </div>
                            <div className="space-y-1 text-right text-xs text-slate-600">
                                <p>{cvData.phone}</p>
                                <p>{cvData.email}</p>
                                <p>{cvData.address}</p>
                            </div>
                        </div>

                        {/* Layout Content CV */}
                        <div className="flex h-full gap-8 px-8 py-6">
                            {/* Left Column CV */}
                            <div className="w-2/3 space-y-6">
                                <div>
                                    <h3
                                        className={`mb-2 border-b border-slate-200 pb-1 text-lg font-bold tracking-wider uppercase ${design.color}`}
                                    >
                                        Tóm tắt
                                    </h3>
                                    <p
                                        className={`text-sm leading-relaxed text-slate-700 ${design.spacing === 'loose' ? 'leading-loose' : design.spacing === 'compact' ? 'leading-snug' : ''}`}
                                    >
                                        {cvData.summary}
                                    </p>
                                </div>

                                <div>
                                    <h3
                                        className={`mb-3 border-b border-slate-200 pb-1 text-lg font-bold tracking-wider uppercase ${design.color}`}
                                    >
                                        Kinh nghiệm
                                    </h3>
                                    {cvData.experiences.map((exp, idx) => (
                                        <div key={idx} className="mb-4">
                                            <div className="mb-1 flex items-baseline justify-between">
                                                <h4 className="font-bold text-slate-800">
                                                    {exp.position}
                                                </h4>
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                                    {exp.duration}
                                                </span>
                                            </div>
                                            <div
                                                className={`mb-2 text-sm font-semibold ${design.color}`}
                                            >
                                                {exp.company}
                                            </div>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                                                {exp.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column CV */}
                            <div className="w-1/3 space-y-6">
                                <div>
                                    <h3
                                        className={`mb-2 border-b border-slate-200 pb-1 text-lg font-bold tracking-wider uppercase ${design.color}`}
                                    >
                                        Học vấn
                                    </h3>
                                    {cvData.education.map((edu, idx) => (
                                        <div key={idx} className="mb-3">
                                            <h4 className="text-sm font-bold text-slate-800">
                                                {edu.degree}
                                            </h4>
                                            <div className="my-0.5 text-sm text-slate-600">
                                                {edu.school}
                                            </div>
                                            <div
                                                className={`text-xs font-medium uppercase ${design.color}`}
                                            >
                                                {edu.duration}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h3
                                        className={`mb-2 border-b border-slate-200 pb-1 text-lg font-bold tracking-wider uppercase ${design.color}`}
                                    >
                                        Kỹ năng
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cvData.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
