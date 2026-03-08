import { useState, useRef, useCallback } from "react";
import { FaCloudUploadAlt, FaFilePdf, FaCheckCircle, FaExclamationTriangle, FaMagic } from "react-icons/fa";
import { Link } from "react-router";
import { evaluateCVPDF } from "../../../../utils/gemini";

function getScoreLabel(score: number): { label: string; color: string } {
    if (score >= 81) return { label: "Xuất sắc", color: "text-emerald-600" };
    if (score >= 61) return { label: "Khá tốt", color: "text-blue-600" };
    if (score >= 41) return { label: "Trung bình", color: "text-amber-600" };
    return { label: "Cần cải thiện nhiều", color: "text-red-600" };
}

export default function CVUploadReviewPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setAnalysisResult(null);
        } else {
            alert("Vui lòng tải lên file PDF");
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, []);

    const startAnalysis = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const result = await evaluateCVPDF(file);
            setAnalysisResult(result);
        } catch (error: any) {
            console.error(error);
            alert("Lỗi khi dùng AI phân tích đánh giá: " + (error.message || "Vui lòng xem lại API Key."));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const scoreInfo = analysisResult ? getScoreLabel(analysisResult.score) : null;

    return (
        <div className="p-4 md:p-8 h-full bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">

                {/* Header Area */}
                <div className="mb-8">
                    <Link to="/dashboard/cv" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Quay lại Quản lý CV</Link>
                    <h1 className="font-bold text-slate-900 text-2xl flex items-center gap-2">
                        <FaMagic className="text-indigo-600" />
                        AI Đánh Giá CV (PDF)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Tải lên file PDF CV của bạn. Trí tuệ nhân tạo sẽ chấm điểm và đưa ra nhận xét chi tiết giúp bạn có một CV hoàn hảo.</p>
                </div>

                {!analysisResult && !isAnalyzing && (
                    <div
                        className={`bg-white p-10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center shadow-sm transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-200'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-50 text-indigo-500'}`}>
                            <FaCloudUploadAlt size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">
                            {isDragging ? 'Thả file vào đây!' : 'Giữ & Kéo thả file PDF vào đây'}
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-md">Hoạt động tốt nhất với file PDF xuất ra tĩnh (có text selectable). Kích thước tối đa: 5MB.</p>

                        <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Chọn file từ máy
                            </button>
                            {file && (
                                <button
                                    onClick={startAnalysis}
                                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                                >
                                    <FaMagic /> Bắt đầu Phân tích AI
                                </button>
                            )}
                        </div>

                        {file && (
                            <div className="mt-6 flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg">
                                <FaFilePdf className="text-red-500" size={24} />
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-slate-800">{file.name}</div>
                                    <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isAnalyzing && (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                                <FaMagic size={24} className="animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">AI đang đọc dữ liệu CV mặt chữ...</h2>
                        <p className="text-slate-500">Tiến trình này có thể mất vài chục giây. Vui lòng chờ nhé.</p>
                    </div>
                )}

                {/* RESULTS SPLIT VIEW */}
                {analysisResult && (
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* LEFT: RESULTS DATA */}
                        <div className="w-full lg:w-[40%] space-y-6">
                            {/* Score Card */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"></div>
                                <h3 className="text-slate-500 font-medium mb-4 uppercase tracking-wider text-sm">Điểm Đánh Giá CV</h3>
                                <div className="flex items-end justify-center gap-2 mb-2">
                                    <span className="text-6xl font-black text-indigo-600">{analysisResult.score}</span>
                                    <span className="text-xl text-slate-400 font-bold mb-2">/ 100</span>
                                </div>
                                <p className="text-sm text-slate-600 px-4">
                                    CV của bạn ở mức <strong className={scoreInfo?.color}>{scoreInfo?.label}</strong>.
                                    {analysisResult.score >= 81
                                        ? ' Rất tốt! CV của bạn đã khá ấn tượng và chuyên nghiệp.'
                                        : analysisResult.score >= 61
                                            ? ' Tuy nhiên vẫn cần cải thiện vài điểm nội dung để lọt mắt xanh nhà tuyển dụng.'
                                            : analysisResult.score >= 41
                                                ? ' Hãy xem xét các gợi ý bên dưới để cải thiện CV tốt hơn.'
                                                : ' CV cần được chỉnh sửa đáng kể. Tham khảo gợi ý bên dưới hoặc thử lại với CV Builder.'
                                    }
                                </p>
                            </div>

                            {/* Analysis Details */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-5 bg-emerald-50 border-b border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                        <FaCheckCircle /> Điểm mạnh
                                    </h3>
                                </div>
                                <div className="p-5">
                                    <ul className="space-y-3">
                                        {analysisResult.strengths.map((item: string, idx: number) => (
                                            <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                                <span className="text-emerald-500 font-bold">•</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-5 bg-amber-50 border-b border-amber-100">
                                    <h3 className="font-bold text-amber-800 flex items-center gap-2">
                                        <FaExclamationTriangle /> Cần cải thiện
                                    </h3>
                                </div>
                                <div className="p-5">
                                    <ul className="space-y-3">
                                        {analysisResult.weaknesses.map((item: string, idx: number) => (
                                            <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                                <span className="text-amber-500 font-bold">•</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                                    Sửa lại trên CV Builder
                                </button>
                                <button onClick={() => { setAnalysisResult(null); setFile(null) }} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                    Tải file khác
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: PDF VIEWER MOCK WITH OVERLAYS */}
                        <div className="w-full lg:w-[60%] bg-slate-200 rounded-3xl min-h-[600px] flex items-center justify-center relative overflow-hidden border border-slate-300">
                            {/* Mocking the loaded PDF as an image or div */}
                            <div className="w-[80%] h-[90%] bg-white shadow-xl flex flex-col items-center justify-center relative pointer-events-none">
                                <FaFilePdf size={60} className="text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium uppercase tracking-widest text-sm">[PDF VIEWER MOCKUP]</p>

                                {/* Comments Overlay */}
                                {analysisResult.details.map((detail: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`absolute left-0 pointer-events-auto flex group`}
                                        style={{ top: `${detail.y}px`, width: '100%' }}
                                    >
                                        <div className="w-full flex">
                                            <div className="w-6 border-b-2 border-dashed border-amber-500 opacity-50"></div>
                                            <div className="bg-white shadow-xl rounded-xl p-4 w-64 border border-slate-200 relative ml-2 transform group-hover:scale-105 transition-transform origin-left z-10">
                                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-b border-l border-slate-200 rotate-45"></div>
                                                <h4 className="text-xs font-bold text-amber-700 mb-1">{detail.title}</h4>
                                                <p className="text-xs text-slate-600 leading-relaxed">{detail.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
