import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, BellPlus, Briefcase, Building2, Clock, Factory, MapPin, Users } from "lucide-react";
import translation from "@/utils/translation";

export interface CompanyMiniCardData {
  id: number;
  name: string;
  avatar?: string | null;
  model?: string | null;
  scale?: string | null;
  industry?: string | null;
  location?: { name?: string } | null;
  startWork?: number | null;
  endWork?: number | null;
  hasOvertime?: boolean | null;
}

interface CompanyMiniCardProps {
  company: CompanyMiniCardData;
  canFollow: boolean;
  following: boolean;
  followLoading: boolean;
  onToggleFollow: () => void;
}

const NOT_UPDATED = "Chưa cập nhật";

function describeOvertime(hasOvertime: boolean | null | undefined): string {
  if (hasOvertime == null) return NOT_UPDATED;
  return hasOvertime ? "Có OT" : "Không có OT";
}

function describeWorkingDays(startWork?: number | null, endWork?: number | null): string {
  return startWork && endWork ? `Thứ ${startWork} - Thứ ${endWork}` : NOT_UPDATED;
}

export const CompanyMiniCard = ({ company, canFollow, following, followLoading, onToggleFollow }: CompanyMiniCardProps) => {
  const details = [
    { icon: Factory, label: "Lĩnh vực", value: company.industry || NOT_UPDATED },
    { icon: MapPin, label: "Địa điểm", value: company.location?.name || NOT_UPDATED },
    { icon: Building2, label: "Mô hình", value: (company.model && translation[company.model]) || NOT_UPDATED },
    { icon: Users, label: "Quy mô", value: (company.scale && translation[company.scale]) || NOT_UPDATED },
    { icon: Clock, label: "Thời gian", value: describeWorkingDays(company.startWork, company.endWork) },
    { icon: Briefcase, label: "OT", value: describeOvertime(company.hasOvertime) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
          {company.avatar ? (
            <img src={company.avatar} alt="" className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-full w-full p-2 text-slate-300" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-base font-bold text-slate-900 dark:text-white">{company.name}</h3>
          <Link
            to={`/company/${company.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Xem công ty <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {canFollow && (
        <button
          type="button"
          onClick={onToggleFollow}
          disabled={followLoading}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
            following
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-400"
              : "border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <BellPlus size={16} />
          {following ? "Đang theo dõi công ty" : "Theo dõi công ty"}
        </button>
      )}

      <dl className="mt-5 space-y-3">
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Icon size={16} className="text-slate-400" /> {label}
            </dt>
            <dd className="truncate text-right font-medium text-slate-900 dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </motion.div>
  );
};
