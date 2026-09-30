import { useCallback, useEffect, useState } from "react";
import type { JobStatsResponse } from "@/types";
import { getApiErrorMessage, jobEngagementService } from "@/services/jobEngagementService";

export function useJobStats(jobId?: number, autoLoad = true) {
  const [stats, setStats] = useState<JobStatsResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(jobId && autoLoad));
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      setStats(await jobEngagementService.getJobStats(jobId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải thống kê công việc."));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (autoLoad) loadStats();
  }, [autoLoad, loadStats]);

  return { stats, loading, error, reload: loadStats };
}
