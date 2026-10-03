package com.example.demo.dto.response;

import java.time.Instant;
import java.util.List;

import com.example.demo.enums.JobEmploymentType;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JobAlertResponse {
    private Long id;
    private String name;
    private String query;
    private String location;
    private String category;
    private String industry;
    private Long minSalary;
    private Long maxSalary;
    private JobPosition position;
    private JobWorkstyle workstyle;
    private JobEmploymentType employmentType;
    private List<String> tags;
    private Boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
