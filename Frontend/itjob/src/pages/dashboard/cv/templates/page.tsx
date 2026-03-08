import { FaRegFileAlt, FaMagic, FaEye } from "react-icons/fa";
import { Link } from "react-router";

export default function CVTemplatesPage() {
    document.title = "Mẫu CV - Kiến tạo sự nghiệp";

    // Mock data for CV templates
    const templates = [
        {
            id: "professional-1",
            name: "Chuyên nghiệp",
            description: "Phù hợp cho các vị trí quản lý, kinh doanh, tài chính.",
            tags: ["Quản lý", "Kinh doanh"],
            thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop",
            color: "bg-blue-500",
        },
        {
            id: "creative-1",
            name: "Sáng tạo",
            description: "Dành cho designer, developer, khối ngành sáng tạo.",
            tags: ["IT", "Design", "Sáng tạo"],
            thumbnail: "https://images.unsplash.com/photo-1542435503-956c469947f6?w=400&h=500&fit=crop",
            color: "bg-indigo-500",
            recommended: true,
        },
        {
            id: "minimalist-1",
            name: "Tối giản",
            description: "Tập trung vào nội dung, dễ đọc, phù hợp mọi ngành nghề.",
            tags: ["Tối giản", "Mọi ngành nghề"],
            thumbnail: "https://images.unsplash.com/photo-1626260485601-52ea76b010c7?w=400&h=500&fit=crop",
            color: "bg-emerald-500",
        },
        {
            id: "modern-1",
            name: "Hiện đại",
            description: "Phong cách Start-up, Dynamic.",
            tags: ["Start-up", "Marketing"],
            thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop",
            color: "bg-violet-500",
        },
        {
            id: "academic-1",
            name: "Học thuật",
            description: "Dành cho giáo viên, nghiên cứu sinh, CV xin học bổng.",
            tags: ["Giáo dục", "Nghiên cứu"],
            thumbnail: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400&h=500&fit=crop",
            color: "bg-slate-700",
        }
    ];

    return (
        <div className="p-4 md:p-8 h-full bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Area */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FaRegFileAlt className="text-indigo-600" />
                            Mẫu CV Chuyên Nghiệp
                        </h1>
                        <p className="text-slate-500">
                            Chọn một mẫu CV phù hợp với phong cách và ngành nghề của bạn để bắt đầu. Hệ thống AI sẽ hỗ trợ bạn điền thông tin nhanh chóng.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to="/dashboard/cv/upload-review" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm">
                            Đánh giá CV của bạn
                        </Link>
                    </div>
                </div>

                {/* Filters/Categories (Mock) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button className="px-5 py-2 rounded-full bg-indigo-600 text-white font-medium text-sm whitespace-nowrap shadow-sm shadow-indigo-200">Tất cả mẫu CV</button>
                    <button className="px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 text-sm whitespace-nowrap transition-colors">IT / Phần mềm (2)</button>
                    <button className="px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 text-sm whitespace-nowrap transition-colors">Marketing / Sale (1)</button>
                    <button className="px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 text-sm whitespace-nowrap transition-colors">Thiết kế / Sáng tạo (1)</button>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates.map((tpl) => (
                        <div key={tpl.id} className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300">
                            {/* Thumbnail Container */}
                            <div className="relative aspect-[1/1.4] bg-slate-100 overflow-hidden">
                                <img
                                    src={tpl.thumbnail}
                                    alt={tpl.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                {/* Overlay actions */}
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <Link
                                        to={`/dashboard/cv/builder?template=${tpl.id}`}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-indigo-900/30"
                                    >
                                        <FaMagic /> Tạo CV này
                                    </Link>
                                    <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                        <FaEye /> Xem trước
                                    </button>
                                </div>

                                {/* Badge recommendations */}
                                {tpl.recommended && (
                                    <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5">
                                        <FaMagic size={10} /> Phù hợp với bạn
                                    </div>
                                )}
                            </div>

                            {/* Template Info */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${tpl.color}`}></div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tpl.name}</h3>
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed flex-1">
                                    {tpl.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-auto">
                                    {tpl.tags.map(tag => (
                                        <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Create Blank Card */}
                    <div className="flex flex-col bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group cursor-pointer justify-center items-center min-h-[350px]">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">Tạo CV từ đầu</h3>
                        <p className="text-sm text-slate-500 text-center px-6">Bắt đầu với một trang trắng và thiết kế theo ý bạn</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
