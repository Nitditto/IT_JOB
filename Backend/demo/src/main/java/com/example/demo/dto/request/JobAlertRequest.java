package com.example.demo.dto.request;

import java.util.List;

import com.example.demo.enums.JobEmploymentType;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JobAlertRequest {
    @NotBlank(message = "Vui lòng nhập tên thông báo!")
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
}
