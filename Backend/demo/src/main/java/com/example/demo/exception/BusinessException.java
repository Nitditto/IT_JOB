package com.example.demo.exception;

/**
 * Vi phạm business rule dạng "trạng thái xung đột" (ví dụ: đã ứng tuyển job này rồi) —
 * khác {@link BadRequestException} (input/format sai) ở chỗ input hợp lệ nhưng
 * không thực hiện được vì trạng thái hiện tại của dữ liệu. Map sang HTTP 409 Conflict.
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
