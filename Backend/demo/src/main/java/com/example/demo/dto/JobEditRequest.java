package com.example.demo.dto;

import java.util.List;

import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class JobEditRequest {
    private Long jobID;
    private String name;
    private Long minSalary;
    private Long maxSalary;
    private JobPosition position;
    private JobWorkstyle workstyle;
    private String address;
    private String location;
    private List<String> tags;
    private List<String> images;
    private String description;

}
