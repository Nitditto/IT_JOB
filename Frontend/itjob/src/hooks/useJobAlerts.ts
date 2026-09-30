import { useCallback, useEffect, useState } from "react";
import type { JobAlertRequest, JobAlertResponse, JobCard } from "@/types";
import { getApiErrorMessage, jobEngagementService } from "@/services/jobEngagementService";

export function validateJobAlert(payload: JobAlertRequest) {
  const errors: Partial<Record<keyof JobAlertRequest, string>> = {};
  if (!payload.name?.trim()) errors.name = "Nhập tên thông báo.";
  if (payload.minSalary !== undefined && payload.minSalary < 0) errors.minSalary = "Lương tối thiểu không hợp lệ.";
  if (payload.maxSalary !== undefined && payload.maxSalary < 0) errors.maxSalary = "Lương tối đa không hợp lệ.";
  if (
    payload.minSalary !== undefined &&
    payload.maxSalary !== undefined &&
    payload.maxSalary < payload.minSalary
  ) {
    errors.maxSalary = "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.";
  }
  return errors;
}

export function useJobAlerts(autoLoad = true) {
  const [alerts, setAlerts] = useState<JobAlertResponse[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<Record<number, JobCard[]>>({});
  const [matchesLoadingId, setMatchesLoadingId] = useState<number | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAlerts(await jobEngagementService.getJobAlerts());
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải thông báo việc làm."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadAlerts();
  }, [autoLoad, loadAlerts]);

  const saveAlert = useCallback(async (payload: JobAlertRequest, alertId?: number) => {
    setSaving(true);
    try {
      const saved = alertId
        ? await jobEngagementService.updateJobAlert(alertId, payload)
        : await jobEngagementService.createJobAlert(payload);
      setAlerts((current) => {
        if (!alertId) return [saved, ...current];
        return current.map((item) => (item.id === alertId ? saved : item));
      });
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteAlert = useCallback(async (alertId: number) => {
    await jobEngagementService.deleteJobAlert(alertId);
    setAlerts((current) => current.filter((item) => item.id !== alertId));
    setMatches((current) => {
      const next = { ...current };
      delete next[alertId];
      return next;
    });
  }, []);

  const previewMatches = useCallback(async (alertId: number) => {
    setMatchesLoadingId(alertId);
    try {
      const data = await jobEngagementService.previewJobAlertMatches(alertId);
      setMatches((current) => ({ ...current, [alertId]: data }));
      return data;
    } finally {
      setMatchesLoadingId(null);
    }
  }, []);

  return {
    alerts,
    loading,
    error,
    saving,
    matches,
    matchesLoadingId,
    reload: loadAlerts,
    saveAlert,
    deleteAlert,
    previewMatches,
  };
}
