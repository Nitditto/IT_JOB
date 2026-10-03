import { useCallback, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export interface ToastMessage {
  kind: ToastKind;
  message: string;
}

export function useToastMessage() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  return { toast, showToast, clearToast: () => setToast(null) };
}
