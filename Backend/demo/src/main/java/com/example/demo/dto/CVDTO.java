package com.example.demo.dto;

import com.example.demo.enums.CVStatus;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CVDTO {
    private Long accountID;
    private Long jobID;

    private String name;
    private String phone;
    private String email;
    private String cvFile;
    private String referral;
    private CVStatus status;

    private String jobName;
    private String companyName;
    private Long minSalary;
    private Long maxSalary;
    private JobPosition position;
    private JobWorkstyle workstyle;

}
