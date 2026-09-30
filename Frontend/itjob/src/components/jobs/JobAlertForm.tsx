import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { BellRing, Save } from "lucide-react";
import type { JobAlertRequest, JobAlertResponse, JobEmploymentType, JobPosition, JobWorkstyle } from "@/types";
import { validateJobAlert } from "@/hooks/useJobAlerts";

const positions: JobPosition[] = ["intern", "fresher", "junior", "middle", "senior", "manager"];
const workstyles: JobWorkstyle[] = ["onsite", "remote", "hybrid"];
const employmentTypes: JobEmploymentType[] = ["full_time", "part_time", "internship", "contract", "freelance"];

const emptyForm: JobAlertRequest = {
  name: "",
  query: "",
  location: "",
  category: "",
  industry: "",
  tags: [],
  active: true,
};

export function JobAlertForm({
  editing,
  saving,
  onSubmit,
  onCancel,
}: {
  editing?: JobAlertResponse | null;
  saving?: boolean;
  onSubmit: (payload: JobAlertRequest, alertId?: number) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<JobAlertRequest>(emptyForm);
  const [tagText, setTagText] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof JobAlertRequest, string>>>({});

  useEffect(() => {
    if (!editing) {
      setForm(emptyForm);
      setTagText("");
      setErrors({});
      return;
    }
    setForm({
      name: editing.name,
      query: editing.query || "",
      location: editing.location || "",
      category: editing.category || "",
      industry: editing.industry || "",
      minSalary: editing.minSalary,
      maxSalary: editing.maxSalary,
      position: editing.position,
      workstyle: editing.workstyle,
      employmentType: editing.employmentType,
      tags: editing.tags || [],
      active: editing.active,
    });
    setTagText(editing.tags?.join(", ") || "");
    setErrors({});
  }, [editing]);

  const title = editing ? "Cập nhật thông báo" : "Tạo thông báo việc làm";
  const description = editing ? "Điều chỉnh tiêu chí để kết quả bớt nhiễu." : "Lưu một bộ lọc để xem nhanh các việc phù hợp.";

  const parsedTags = useMemo(
    () => tagText.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagText]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: JobAlertRequest = {
      ...form,
      name: form.name.trim(),
      query: form.query?.trim() || undefined,
      location: form.location?.trim() || undefined,
      category: form.category?.trim() || undefined,
      industry: form.industry?.trim() || undefined,
      tags: parsedTags,
      minSalary: form.minSalary === undefined || Number.isNaN(form.minSalary) ? undefined : Number(form.minSalary),
      maxSalary: form.maxSalary === undefined || Number.isNaN(form.maxSalary) ? undefined : Number(form.maxSalary),
    };

    const nextErrors = validateJobAlert(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit(payload, editing?.id);
    if (!editing) {
      setForm(emptyForm);
      setTagText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <BellRing size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tên thông báo" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500"
            placeholder="Frontend remote lương tốt"
          />
        </Field>
        <Field label="Từ khóa">
          <input
            value={form.query || ""}
            onChange={(e) => setForm((current) => ({ ...current, query: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500"
            placeholder="React, Java, DevOps..."
          />
        </Field>
        <Field label="Địa điểm">
          <input
            value={form.location || ""}
            onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500"
            placeholder="HCM, HN..."
          />
        </Field>
        <Field label="Ngành">
          <input
            value={form.industry || ""}
            onChange={(e) => setForm((current) => ({ ...current, industry: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500"
            placeholder="Fintech, SaaS..."
          />
        </Field>
        <Field label="Lương từ" error={errors.minSalary}>
          <input
            type="number"
            min={0}
            value={form.minSalary ?? ""}
            onChange={(e) => setForm((current) => ({ ...current, minSalary: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500"
          />
        </Field>
        <Field label="Lương đến" error={errors.maxSalary}>
          <input
            type="number"
            min={0}
            value={form.maxSalary ?? ""}
            onChange={(e) => setForm((current) => ({ ...current, maxSalary: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500"
          />
        </Field>
        <SelectField label="Cấp bậc" value={form.position || ""} onChange={(value) => setForm((current) => ({ ...current, position: value as JobPosition || undefined }))} options={positions} />
        <SelectField label="Hình thức" value={form.workstyle || ""} onChange={(value) => setForm((current) => ({ ...current, workstyle: value as JobWorkstyle || undefined }))} options={workstyles} />
        <SelectField label="Loại hợp đồng" value={form.employmentType || ""} onChange={(value) => setForm((current) => ({ ...current, employmentType: value as JobEmploymentType || undefined }))} options={employmentTypes} />
        <Field label="Tags">
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500"
            placeholder="React, TypeScript, AWS"
          />
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={form.active ?? true}
          onChange={(e) => setForm((current) => ({ ...current, active: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
        Bật thông báo này
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
          <Save size={16} /> {saving ? "Đang lưu..." : "Lưu thông báo"}
        </button>
        {editing && (
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Hủy chỉnh sửa
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-indigo-500">
        <option value="">Tất cả</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </Field>
  );
}
