import api from "@/utils/api";
import type {
  CompanyFollowResponse,
  JobAlertRequest,
  JobAlertResponse,
  JobCard,
  JobStatsResponse,
  SavedJobResponse,
  UserJobStateResponse,
} from "@/types";

export const jobEngagementService = {
  saveJob: async (jobId: number) => {
    const response = await api.post<SavedJobResponse>(`/jobs/${jobId}/save`);
    return response.data;
  },

  unsaveJob: async (jobId: number) => {
    await api.delete(`/jobs/${jobId}/save`);
  },

  getSavedJobs: async () => {
    const response = await api.get<SavedJobResponse[]>("/jobs/saved");
    return response.data;
  },

  getJobState: async (jobId: number) => {
    const response = await api.get<UserJobStateResponse>(`/jobs/${jobId}/state`);
    return response.data;
  },

  followCompany: async (companyId: number) => {
    const response = await api.post<CompanyFollowResponse>(`/companies/${companyId}/follow`);
    return response.data;
  },

  unfollowCompany: async (companyId: number) => {
    await api.delete(`/companies/${companyId}/follow`);
  },

  getFollowedCompanies: async () => {
    const response = await api.get<CompanyFollowResponse[]>("/companies/following");
    return response.data;
  },

  getFollowerCount: async (companyId: number) => {
    const response = await api.get<number>(`/companies/${companyId}/followers/count`);
    return response.data;
  },

  getJobAlerts: async () => {
    const response = await api.get<JobAlertResponse[]>("/job-alerts");
    return response.data;
  },

  createJobAlert: async (payload: JobAlertRequest) => {
    const response = await api.post<JobAlertResponse>("/job-alerts", payload);
    return response.data;
  },

  updateJobAlert: async (alertId: number, payload: JobAlertRequest) => {
    const response = await api.put<JobAlertResponse>(`/job-alerts/${alertId}`, payload);
    return response.data;
  },

  deleteJobAlert: async (alertId: number) => {
    await api.delete(`/job-alerts/${alertId}`);
  },

  previewJobAlertMatches: async (alertId: number) => {
    const response = await api.get<JobCard[]>(`/job-alerts/${alertId}/matches`);
    return response.data;
  },

  getJobStats: async (jobId: number) => {
    const response = await api.get<JobStatsResponse>(`/jobs/${jobId}/stats`);
    return response.data;
  },
};

export function getApiErrorMessage(error: unknown, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
