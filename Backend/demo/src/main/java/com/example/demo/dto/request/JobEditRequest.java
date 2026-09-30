package com.example.demo.dto.request;

import java.time.Instant;
import java.util.List;

import com.example.demo.enums.JobEmploymentType;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobStatus;
import com.example.demo.enums.JobWorkstyle;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class JobEditRequest {
    private Long jobID;
    private String name;
    private String category;
    private String industry;
    private String salaryCurrency;
    private Boolean salaryNegotiable;
    private Long minSalary;
    private Long maxSalary;
    private Integer minExperienceYears;
    private Integer maxExperienceYears;
    private Integer vacancies;
    private Instant deadline;
    private Boolean urgent;
    private Boolean featured;
    private JobPosition position;
    private JobWorkstyle workstyle;
    private JobEmploymentType employmentType;
    private JobStatus status;
    private String address;
    private String location;
    private List<String> tags;
    private List<String> images;
    private String description;
    private String requirements;
    private String benefits;
    private String workingTime;

}

