package com.example.demo.exception;

/** Dịch vụ phụ thuộc bên ngoài (ví dụ Gemini) chưa cấu hình hoặc đang lỗi — map sang HTTP 503. */
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(final String message) {
        super(message);
    }
}
