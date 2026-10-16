import type { ReactNode } from "react";
import { FaCircleCheck, FaCircleDot, FaCircleXmark } from "react-icons/fa6";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  info: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-400",
  neutral: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

interface StatusConfig {
  label: string;
  tone: Tone;
  icon: ReactNode;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: { label: "Chưa duyệt", tone: "warning", icon: <FaCircleDot size={10} /> },
  APPROVED: { label: "Đã nhận", tone: "success", icon: <FaCircleCheck size={10} /> },
  REJECTED: { label: "Từ chối", tone: "danger", icon: <FaCircleXmark size={10} /> },
  INTERVIEW_SCHEDULED: { label: "Đã hẹn phỏng vấn", tone: "info", icon: <FaCircleDot size={10} /> },
  INTERVIEW_DONE: { label: "Đã phỏng vấn", tone: "info", icon: <FaCircleCheck size={10} /> },
  OFFERED: { label: "Đã gửi offer", tone: "success", icon: <FaCircleCheck size={10} /> },
  WITHDRAWN: { label: "Đã rút hồ sơ", tone: "neutral", icon: <FaCircleXmark size={10} /> },
};

const FALLBACK_CONFIG = STATUS_CONFIG.PENDING;

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[config.tone]} ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
