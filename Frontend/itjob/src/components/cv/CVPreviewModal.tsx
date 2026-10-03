import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import CVPreview from "./CVPreview";
import { FaMagic, FaSpinner } from "react-icons/fa";
import { toPng } from 'html-to-image';

interface CVPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: {
        id: string;
        name: string;
        description: string;
        color: string;
    } | null;
}

const SAMPLE_CV_DATA = {
    fullName: 'Nguyễn Văn A',
    jobTitle: 'Frontend Developer',
    email: 'nguyenvana@gmail.com',
    phone: '0987654321',
    address: 'Hà Nội, Việt Nam',
    summary:
        'Lập trình viên Frontend với 2 năm kinh nghiệm trong việc phát triển các ứng dụng web phức tạp sử dụng ReactJS và TypeScript. Tối ưu hóa hiệu năng và trải nghiệm người dùng là đam mê hàng đầu.',
    experiences: [
        {
            company: 'Tech Company Inc.',
            position: 'Frontend Developer',
            duration: '01/2022 - Hiện tại',
            description:
                '- Phát triển và bảo trì các tính năng chính của sản phẩm.\n- Tối ưu hóa hiệu năng ứng dụng, giảm thời gian load 30%.\n- Phối hợp với team thiết kế để đảm bảo UI/UX tốt nhất.',
        },
        {
            company: 'Start-up Fast',
            position: 'Junior Web Developer',
            duration: '06/2021 - 12/2021',
            description:
                '- Xây dựng landing page cho các chiến dịch marketing.\n- Sửa lỗi và cải thiện giao diện người dùng dựa trên phản hồi.',
        }
    ],
    education: [
        {
            school: 'Đại học Bách Khoa Hà Nội',
            degree: 'Cử nhân Công nghệ Thông tin',
            duration: '2018 - 2022',
        },
    ],
    skills: ['ReactJS', 'TypeScript', 'Tailwind CSS', 'NodeJS', 'Git', 'UI/UX Design'],
};

const SAMPLE_DESIGN = {
    font: '!font-inter',
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    spacing: 'normal',
};

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({ isOpen, onClose, template }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const hiddenPreviewRef = useRef<HTMLDivElement>(null);

    // Adjust design based on template if needed
    const design = template ? {
        ...SAMPLE_DESIGN,
        bgColor: template.color,
        color: template.color.replace('bg-', 'text-'),
    } : SAMPLE_DESIGN;

    useEffect(() => {
        if (isOpen && template && !previewImage) {
            generatePreview();
        }
        
        if (!isOpen) {
            setPreviewImage(null);
            setIsGenerating(false);
        }
    }, [isOpen, template]);

    const generatePreview = async () => {
        setIsGenerating(true);
        // Wait a small bit for the hidden component to mount/render
        setTimeout(async () => {
            if (hiddenPreviewRef.current) {
                try {
                    const dataUrl = await toPng(hiddenPreviewRef.current, {
                        quality: 1,
                        pixelRatio: 2,
                        backgroundColor: '#ffffff',
                        skipFonts: true,
                    });
                    setPreviewImage(dataUrl);
                } catch (error) {
                    console.error("Error generating preview image:", error);
                } finally {
                    setIsGenerating(false);
                }
            } else {
                // If ref is not available yet, try again briefly
                setTimeout(generatePreview, 100);
            }
        }, 300);
    };

    if (!template) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100 border-none shadow-2xl">
                <DialogHeader className="p-6 bg-white border-b border-slate-200 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FaMagic className="text-indigo-600" />
                            Xem trước mẫu: {template.name}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Đây là bản xem trước của mẫu CV với dữ liệu mẫu dạng hình ảnh.
                        </DialogDescription>
                    </div>
                    <div className="flex gap-3 pr-8">
                         <button 
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 shadow-md shadow-indigo-200"
                            onClick={() => {
                                window.location.href = `/cv/builder?template=${template.id}`;
                            }}
                        >
                            Dùng mẫu này
                        </button>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-slate-200/50">
                    {/* Hidden preview component used for capture */}
                    <div className="absolute opacity-0 pointer-events-none -z-10 left-[-9999px]">
                        <CVPreview 
                            cvData={SAMPLE_CV_DATA} 
                            design={design} 
                            previewRef={hiddenPreviewRef} 
                            scale="1" 
                        />
                    </div>

                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
                            <p className="text-slate-500 font-medium animate-pulse">Đang nạp bản xem trước...</p>
                        </div>
                    ) : (
                        previewImage && (
                            <div className="w-full max-w-2xl shadow-2xl bg-white mb-8">
                                <img 
                                    src={previewImage} 
                                    alt={`Preview of ${template.name}`} 
                                    className="w-full h-auto"
                                />
                            </div>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CVPreviewModal;
