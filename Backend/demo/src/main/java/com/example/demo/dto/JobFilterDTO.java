package com.example.demo.dto;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class JobFilterDTO {
    private String query;
    private String region;
    private List<String> levels;
    private List<String> workStyles;
    private Integer minSalary;
    private Integer maxSalary;
    private List<String> skills;
}