package com.example.demo.exception;

/**
 * Xác thực thất bại ở tầng business logic (ví dụ: refresh token hết hạn/đã revoke) —
 * khác {@link BadRequestException} ở chỗ đây là vấn đề danh tính/phiên đăng nhập, không phải
 * dữ liệu request sai định dạng. Map sang HTTP 401 Unauthorized.
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
