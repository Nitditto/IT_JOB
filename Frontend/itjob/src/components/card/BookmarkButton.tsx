import { Heart } from "lucide-react";

interface BookmarkButtonProps {
  saved: boolean;
  disabled: boolean;
  onClick: (event: React.MouseEvent) => void;
  className?: string;
}

export const BookmarkButton = ({ saved, disabled, onClick, className = "" }: BookmarkButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={saved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
      saved
        ? "border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/50 dark:bg-rose-950/40"
        : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-800"
    } ${className}`}
  >
    <Heart size={16} fill={saved ? "currentColor" : "none"} strokeWidth={saved ? 0 : 2} />
  </button>
);
