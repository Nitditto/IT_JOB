package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CVCreationRequest {
    @NotBlank(message = "Vui lòng điền tên của bạn!")
    private String name;
    @NotBlank(message = "Vui lòng điền số điện thoại của bạn!")
    private String phone;
    @NotBlank(message = "Vui lòng nộp file CV của bạn!")
    private String cvFile;

    private String referral;
}
