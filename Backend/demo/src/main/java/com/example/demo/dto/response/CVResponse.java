package com.example.demo.dto.response;

import java.time.Instant;

import com.example.demo.enums.CVStatus;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CVResponse {
    private Long accountID;
    private Long jobID;

    private String name;
    private String phone;
    private String email;
    private String cvFile;
    private String referral;
    private String coverLetter;
    private String portfolioUrl;
    private Long expectedSalary;
    private Instant availableFrom;
    private Instant submittedAt;
    private Instant updatedAt;
    private CVStatus status;

    private String jobName;
    private String companyName;
    private Long minSalary;
    private Long maxSalary;
    private JobPosition position;
    private JobWorkstyle workstyle;

}

