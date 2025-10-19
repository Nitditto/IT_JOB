package com.example.demo.dto;

import com.example.demo.enums.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {
    
    @NotBlank(message = "Vui lòng nhập email của bạn!")
    @Email(message = "Email không đúng định dạng!")
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu của bạn!")
    private String password;
}
