package com.example.demo.dto.response;

import java.time.Instant;
import java.util.List;

import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;
import com.example.demo.model.Location;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class JobResponse {
    private Long id;
    private Instant createdAt;
    private Long companyID;
    private String name;
    private Long minSalary;
    private Long maxSalary;
    private JobPosition position;
    private JobWorkstyle workstyle;
    private Location location;
    private String address;
    private List<String> tags;
    private List<String> images;
    private String description;
    private Integer appliedCount;
}
