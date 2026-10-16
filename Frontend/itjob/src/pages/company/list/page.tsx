import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Building2, MapPin, Search, Users } from "lucide-react";
import api from "@/utils/api";
import translation from "@/utils/translation";
import type { Company, JobCard } from "@/types";

const FALLBACK_AVATAR = "/assets/images/avatar_default.png";
const MODEL_OPTIONS = ["product", "service"];
const SCALE_OPTIONS = ["small", "medium", "large"];

interface CompanyFilters {
  query: string;
  location: string;
  model: string;
  scale: string;
  overtimeOnly: boolean;
}

const EMPTY_FILTERS: CompanyFilters = { query: "", location: "", model: "", scale: "", overtimeOnly: false };

function countJobsByCompany(jobs: JobCard[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const job of jobs) {
    counts.set(job.companyID, (counts.get(job.companyID) ?? 0) + 1);
  }
  return counts;
}

function matchesFilters(company: Company, filters: CompanyFilters): boolean {
  const query = filters.query.trim().toLowerCase();
  if (query && !company.name.toLowerCase().includes(query)) return false;
  if (filters.location && company.location?.abbreviation !== filters.location) return false;
  if (filters.model && company.model !== filters.model) return false;
  if (filters.scale && company.scale !== filters.scale) return false;
  if (filters.overtimeOnly && !company.hasOvertime) return false;
  return true;
}

const selectClassName =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

function CompanyListCard({ company, jobCount }: { company: Company; jobCount: number }) {
  return (
    <Link
      to={`/company/${company.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 dark:border-slate-700">
          <img src={company.avatar || FALLBACK_AVATAR} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {company.name}
          </h3>
          <div className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{company.industry || "Chưa cập nhật ngành"}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {company.model && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {translation[company.model] ?? company.model}
          </span>
        )}
        {company.hasOvertime && (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Có OT</span>
        )}
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{company.location?.name ?? "Chưa cập nhật"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{company.scale ? translation[company.scale] ?? company.scale : "Chưa cập nhật"}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 text-sm font-semibold text-indigo-700 dark:border-slate-800 dark:text-indigo-400">
        {jobCount > 0 ? `Đang tuyển ${jobCount} vị trí` : "Chưa có vị trí đang mở"}
      </div>
    </Link>
  );
}

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobCounts, setJobCounts] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CompanyFilters>(EMPTY_FILTERS);

  useEffect(() => {
    document.title = "Danh sách công ty IT";
    Promise.all([api.get("/companies"), api.get("/jobs")])
      .then(([companyResponse, jobResponse]) => {
        setCompanies(Array.isArray(companyResponse.data) ? companyResponse.data : []);
        setJobCounts(countJobsByCompany(Array.isArray(jobResponse.data) ? jobResponse.data : []));
      })
      .catch((error) => console.error("Không tải được danh sách công ty:", error))
      .finally(() => setLoading(false));
  }, []);

  const locationOptions = useMemo(() => {
    const byAbbreviation = new Map<string, string>();
    for (const company of companies) {
      if (company.location) byAbbreviation.set(company.location.abbreviation, company.location.name);
    }
    return [...byAbbreviation.entries()];
  }, [companies]);

  const visibleCompanies = useMemo(
    () =>
      companies
        .filter((company) => matchesFilters(company, filters))
        .sort((a, b) => (jobCounts.get(b.id) ?? 0) - (jobCounts.get(a.id) ?? 0)),
    [companies, filters, jobCounts],
  );

  const updateFilter = <K extends keyof CompanyFilters>(key: K, value: CompanyFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="bg-background text-foreground">
      <div className="border-b border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="container">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Công ty công nghệ</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tìm hiểu nhà tuyển dụng IT và các vị trí họ đang mở.</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative min-w-60 flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filters.query}
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder="Tìm theo tên công ty"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <select value={filters.location} onChange={(event) => updateFilter("location", event.target.value)} className={selectClassName} aria-label="Địa điểm">
              <option value="">Mọi địa điểm</option>
              {locationOptions.map(([abbreviation, name]) => (
                <option key={abbreviation} value={abbreviation}>{name}</option>
              ))}
            </select>
            <select value={filters.model} onChange={(event) => updateFilter("model", event.target.value)} className={selectClassName} aria-label="Mô hình công ty">
              <option value="">Mọi mô hình</option>
              {MODEL_OPTIONS.map((value) => (
                <option key={value} value={value}>{translation[value]}</option>
              ))}
            </select>
            <select value={filters.scale} onChange={(event) => updateFilter("scale", event.target.value)} className={selectClassName} aria-label="Quy mô">
              <option value="">Mọi quy mô</option>
              {SCALE_OPTIONS.map((value) => (
                <option key={value} value={value}>{translation[value]}</option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={filters.overtimeOnly}
                onChange={(event) => updateFilter("overtimeOnly", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              Có OT
            </label>
            {hasActiveFilters && (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container py-10">
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          {loading ? "Đang tải..." : `${visibleCompanies.length} công ty`}
        </p>

        {!loading && visibleCompanies.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 size={44} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <h2 className="font-semibold text-slate-600 dark:text-slate-400">Không tìm thấy công ty phù hợp</h2>
            <p className="mt-1 text-sm text-slate-400">Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCompanies.map((company) => (
              <CompanyListCard key={company.id} company={company} jobCount={jobCounts.get(company.id) ?? 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
