import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "@/utils/api";
import translation from "@/utils/translation";

const POSITIONS = ["intern", "fresher", "junior", "middle", "senior", "manager"];
const WORKSTYLES = ["onsite", "hybrid", "remote"];
const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  internship: "Thực tập",
  contract: "Hợp đồng",
  freelance: "Freelance",
};
const MAX_TAG_OPTIONS = 12;
const FILTER_KEYS = ["position", "workstyle", "employmentType", "tags", "category", "minSalary", "maxSalary", "featured", "urgent"];

interface SearchFilterSidebarProps {
  searchParams: URLSearchParams;
  setSearchParams: (next: URLSearchParams) => void;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0 dark:border-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

function CheckboxOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-600 dark:text-slate-400">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
      {label}
    </label>
  );
}

export const SearchFilterSidebar = ({ searchParams, setSearchParams }: SearchFilterSidebarProps) => {
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState(searchParams.get("minSalary") ?? "");
  const [maxSalary, setMaxSalary] = useState(searchParams.get("maxSalary") ?? "");

  useEffect(() => {
    api
      .get("/jobs/tags")
      .then((response) => {
        const tags = Array.isArray(response.data) ? response.data : [];
        setTagOptions(tags.slice(0, MAX_TAG_OPTIONS).map((item: { tag: string }) => item.tag));
      })
      .catch((error) => console.error("Không tải được danh sách công nghệ:", error));
  }, []);

  useEffect(() => {
    setMinSalary(searchParams.get("minSalary") ?? "");
    setMaxSalary(searchParams.get("maxSalary") ?? "");
  }, [searchParams]);

  const update = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    next.delete("page");
    setSearchParams(next);
  };

  const toggleValue = (key: string, value: string) => {
    update((next) => {
      const current = next.getAll(key);
      next.delete(key);
      const updated = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      updated.forEach((item) => next.append(key, item));
    });
  };

  const applySalary = () => {
    update((next) => {
      for (const [key, value] of [["minSalary", minSalary], ["maxSalary", maxSalary]] as const) {
        if (value && Number(value) > 0) next.set(key, value);
        else next.delete(key);
      }
    });
  };

  const resetAll = () => update((next) => FILTER_KEYS.forEach((key) => next.delete(key)));

  const hasActiveFilters = FILTER_KEYS.some((key) => searchParams.has(key));
  const category = searchParams.get("category");

  return (
    <aside className="rounded-xl border border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 py-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-white">Bộ lọc</h2>
        {hasActiveFilters && (
          <button type="button" onClick={resetAll} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            Xóa bộ lọc
          </button>
        )}
      </div>

      {category && (
        <FilterGroup title="Lĩnh vực">
          <button
            type="button"
            onClick={() => update((next) => next.delete("category"))}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            {category}
            <X size={14} />
          </button>
        </FilterGroup>
      )}

      <FilterGroup title="Mức lương ($)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Từ"
            value={minSalary}
            onChange={(event) => setMinSalary(event.target.value)}
            onBlur={applySalary}
            onKeyDown={(event) => event.key === "Enter" && applySalary()}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            min={0}
            placeholder="Đến"
            value={maxSalary}
            onChange={(event) => setMaxSalary(event.target.value)}
            onBlur={applySalary}
            onKeyDown={(event) => event.key === "Enter" && applySalary()}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Cấp bậc">
        {POSITIONS.map((value) => (
          <CheckboxOption key={value} label={translation[value] ?? value} checked={searchParams.getAll("position").includes(value)} onChange={() => toggleValue("position", value)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Hình thức làm việc">
        {WORKSTYLES.map((value) => (
          <CheckboxOption key={value} label={translation[value] ?? value} checked={searchParams.getAll("workstyle").includes(value)} onChange={() => toggleValue("workstyle", value)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Loại hợp đồng">
        {Object.entries(EMPLOYMENT_TYPES).map(([value, label]) => (
          <CheckboxOption key={value} label={label} checked={searchParams.getAll("employmentType").includes(value)} onChange={() => toggleValue("employmentType", value)} />
        ))}
      </FilterGroup>

      {tagOptions.length > 0 && (
        <FilterGroup title="Công nghệ">
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const active = searchParams.getAll("tags").includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleValue("tags", tag)}
                  aria-pressed={active}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}
    </aside>
  );
};
