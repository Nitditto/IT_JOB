import React from 'react';

interface Experience {
    company: string;
    position: string;
    duration: string;
    description: string;
}

interface Education {
    school: string;
    degree: string;
    duration: string;
}

interface CVData {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    address: string;
    summary: string;
    experiences: Experience[];
    education: Education[];
    skills: string[];
}

interface Design {
    font: string;
    color: string;
    bgColor: string;
    spacing: string;
}

interface CVPreviewProps {
    cvData: CVData;
    design: Design;
    previewRef?: React.RefObject<HTMLDivElement | null>;
    scale?: string;
}

const CVPreview: React.FC<CVPreviewProps> = ({ cvData, design, previewRef, scale = '0.8' }) => {
    return (
        <div
            ref={previewRef}
            className={`flex h-auto min-h-[297mm] w-[210mm] flex-col bg-white p-0 shadow-2xl ${design.font}`}
            style={{ transformOrigin: 'top center', scale: scale }}
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
    );
};

export default CVPreview;
