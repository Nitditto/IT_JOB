package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteAccountRequest {
    @NotBlank(message = "Vui lòng nhập mật khẩu để xác nhận")
    private String password;
}