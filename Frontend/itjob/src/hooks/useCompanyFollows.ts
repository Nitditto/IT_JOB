import { useCallback, useEffect, useState } from "react";
import type { CompanyFollowResponse } from "@/types";
import { getApiErrorMessage, jobEngagementService } from "@/services/jobEngagementService";

export function useCompanyFollows(autoLoad = true) {
  const [follows, setFollows] = useState<CompanyFollowResponse[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<number | null>(null);

  const loadFollows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFollows(await jobEngagementService.getFollowedCompanies());
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải công ty đang theo dõi."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadFollows();
  }, [autoLoad, loadFollows]);

  const unfollowCompany = useCallback(async (companyId: number) => {
    setMutatingId(companyId);
    try {
      await jobEngagementService.unfollowCompany(companyId);
      setFollows((current) => current.filter((item) => item.company.id !== companyId));
    } finally {
      setMutatingId(null);
    }
  }, []);

  return { follows, loading, error, mutatingId, reload: loadFollows, unfollowCompany };
}
