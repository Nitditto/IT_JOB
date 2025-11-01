package com.example.demo.dto;

import com.example.demo.enums.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RegistrationRequest {
    
    @NotBlank(message = "Vui lòng nhập họ tên của bạn!")
    private String name;

    @NotBlank(message = "Vui lòng nhập email của bạn!")
    @Email(message = "Email không đúng định dạng!")
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu của bạn!")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$",
        message = "Mật khẩu phải có ít nhắt 8 kí tự, bao gồm 1 chữ cái hoa, 1 chữ cái thường, 1 chữ số và 1 kí tự đặc biệt!"
    )
    private String password;


    private UserRole role;
}
