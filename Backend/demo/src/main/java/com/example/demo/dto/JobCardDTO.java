package com.example.demo.dto;

import java.util.List;

import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;
import com.example.demo.model.Location;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class JobCardDTO {
    private Long id;
    private String name;
    private Long companyID;
    private String companyName;
    private String companyAvatar;
    private Long minSalary;
    private Long maxSalary;
    private JobPosition position;
    private JobWorkstyle workstyle;
    private Location location;
    private List<String> tags;
}
