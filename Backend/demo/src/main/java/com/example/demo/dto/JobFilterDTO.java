package com.example.demo.dto;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class JobFilterDTO {
    private String query;
    private String location;
    private List<String> position;
    private List<String> workstyle;
    private Integer minSalary;
    private Integer maxSalary;
    private List<String> tags;
    private Long companyID;
}