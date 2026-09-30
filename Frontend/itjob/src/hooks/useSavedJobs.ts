import { useCallback, useEffect, useState } from "react";
import type { SavedJobResponse, UserJobStateResponse } from "@/types";
import { getApiErrorMessage, jobEngagementService } from "@/services/jobEngagementService";

export function useSavedJobs(autoLoad = true) {
  const [savedJobs, setSavedJobs] = useState<SavedJobResponse[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<number | null>(null);

  const loadSavedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSavedJobs(await jobEngagementService.getSavedJobs());
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải danh sách việc đã lưu."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadSavedJobs();
  }, [autoLoad, loadSavedJobs]);

  const unsaveJob = useCallback(async (jobId: number) => {
    setMutatingId(jobId);
    try {
      await jobEngagementService.unsaveJob(jobId);
      setSavedJobs((current) => current.filter((item) => item.job.id !== jobId));
    } finally {
      setMutatingId(null);
    }
  }, []);

  return { savedJobs, loading, error, mutatingId, reload: loadSavedJobs, unsaveJob };
}

export function useJobState(jobId?: number, enabled = true) {
  const [state, setState] = useState<UserJobStateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const loadState = useCallback(async () => {
    if (!jobId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      setState(await jobEngagementService.getJobState(jobId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải trạng thái công việc."));
    } finally {
      setLoading(false);
    }
  }, [enabled, jobId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const toggleSaved = useCallback(async () => {
    if (!jobId) return;
    setMutating(true);
    try {
      if (state?.saved) {
        await jobEngagementService.unsaveJob(jobId);
        setState((current) => current ? { ...current, saved: false } : current);
        return false;
      }
      await jobEngagementService.saveJob(jobId);
      setState((current) => current ? { ...current, saved: true } : { jobId, saved: true, applied: false });
      return true;
    } finally {
      setMutating(false);
    }
  }, [jobId, state?.saved]);

  return { state, loading, error, mutating, reload: loadState, toggleSaved };
}
