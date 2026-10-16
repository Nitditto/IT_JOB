import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage, jobEngagementService } from "@/services/jobEngagementService";

const MESSAGE_DURATION_MS = 2500;

export function useJobBookmark(jobId: number) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const loadState = async () => {
      if (!user || user.role !== "ROLE_USER" || !jobId) return;
      try {
        const state = await jobEngagementService.getJobState(jobId);
        if (!ignore) setSaved(state.saved);
      } catch {
        if (!ignore) setSaved(false);
      }
    };
    loadState();
    return () => {
      ignore = true;
    };
  }, [jobId, user]);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), MESSAGE_DURATION_MS);
  };

  const toggleBookmark = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user || user.role !== "ROLE_USER") {
      showMessage("Đăng nhập tài khoản ứng viên để lưu việc.");
      return;
    }
    setMutating(true);
    try {
      if (saved) {
        await jobEngagementService.unsaveJob(jobId);
        setSaved(false);
        showMessage("Đã bỏ lưu.");
      } else {
        await jobEngagementService.saveJob(jobId);
        setSaved(true);
        showMessage("Đã lưu việc.");
      }
    } catch (err) {
      showMessage(getApiErrorMessage(err, "Không thể cập nhật lưu việc."));
    } finally {
      setMutating(false);
    }
  };

  return { saved, mutating, message, toggleBookmark };
}
