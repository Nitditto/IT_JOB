package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SalaryStatResponse {
    private String tag;
    private String currency;
    private Long jobCount;
    private Long minSalary;
    private Long maxSalary;
    private Double avgSalary;
}
