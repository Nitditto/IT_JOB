package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CVEditRequest {
    private String name;
    private String phone;
    private String cvFile;
    private String referral;
}
