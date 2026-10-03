package com.example.demo.dto.request;

import java.time.Instant;

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
    private String coverLetter;
    private String portfolioUrl;
    private Long expectedSalary;
    private Instant availableFrom;
}

