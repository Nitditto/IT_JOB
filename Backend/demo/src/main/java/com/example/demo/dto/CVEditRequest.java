package com.example.demo.dto;

import com.example.demo.enums.CVStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CVEditRequest {
    private String name;
    private String phone;
    private String email;
    private String cvFile;
    private String referral;
    private CVStatus status;
}
