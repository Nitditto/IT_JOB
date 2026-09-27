package com.example.demo.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructor có cấu trúc kiểu {@code new ResourceNotFoundException("User", "email", email)}
     * — dùng cho code mới, tự sinh message thống nhất thay vì viết tay từng chỗ.
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super("%s không tồn tại với %s: %s".formatted(resourceName, fieldName, fieldValue));
    }
}
