package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    
    @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
    private String oldPassword;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$",
        message = "Mật khẩu phải có ít nhất 8 kí tự, bao gồm 1 chữ cái hoa, 1 chữ cái thường, 1 chữ số và 1 kí tự đặc biệt!"
    )
    private String newPassword;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu mới")
    private String confirmPassword;
}

