import { Link } from "react-router";
import { BarChart3, FileText, Sparkles, type LucideIcon } from "lucide-react";

interface ToolkitItem {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  action: string;
}

const TOOLKIT_ITEMS: ToolkitItem[] = [
  {
    icon: Sparkles,
    title: "AI đánh giá CV",
    description: "Tải CV lên để nhận phân tích điểm mạnh, điểm yếu và gợi ý chỉnh sửa.",
    to: "/cv/upload-review",
    action: "Đánh giá CV",
  },
  {
    icon: FileText,
    title: "Mẫu CV cho dân IT",
    description: "Mẫu CV tối giản, nhấn vào tech stack và dự án để nhà tuyển dụng nắm nhanh.",
    to: "/cv/templates",
    action: "Chọn mẫu CV",
  },
  {
    icon: BarChart3,
    title: "Thống kê mức lương",
    description: "Xem mức lương theo công nghệ dựa trên các tin tuyển dụng đang mở.",
    to: "/#salary-insights",
    action: "Xem thống kê",
  },
];

export const DeveloperToolkit = () => (
  <section className="py-16">
    <div className="container">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Công cụ dành cho lập trình viên</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Miễn phí, dùng ngay trên IT.JOB</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TOOLKIT_ITEMS.map(({ icon: Icon, title, description, to, action }) => (
          <div key={title} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-700">
              <Icon size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
            <Link
              to={to}
              className="mt-5 inline-flex w-fit items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {action}
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);
