package com.example.demo.exception;

/**
 * Ownership/authorization check thất bại trong tầng service (ví dụ: công ty A cố xoá job
 * của công ty B) — khác với Spring Security's {@code AccessDeniedException} (thất bại ở
 * {@code @PreAuthorize}/role check) ở chỗ đây là business-level ownership check, không phải
 * role check. Map sang HTTP 403 Forbidden, xem {@code GlobalExceptionHandler}.
 */
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) {
        super(message);
    }
}
