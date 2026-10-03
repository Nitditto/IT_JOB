package com.example.demo.dto.request;

import java.time.Instant;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class JobFilterRequest {
    private String query;
    private String location;
    private List<String> position;
    private List<String> workstyle;
    private List<String> employmentType;
    private List<String> status;
    private Integer minSalary;
    private Integer maxSalary;
    private Integer minExperienceYears;
    private Integer maxExperienceYears;
    private List<String> tags;
    private String category;
    private String industry;
    private Boolean salaryNegotiable;
    private Boolean urgent;
    private Boolean featured;
    private Instant deadlineFrom;
    private Instant deadlineTo;
    private String sortBy;
    private String sortDirection;
    private Long companyID;
}

