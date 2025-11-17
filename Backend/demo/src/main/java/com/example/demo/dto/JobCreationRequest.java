package com.example.demo.dto;

import java.util.List;

import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class JobCreationRequest {
    
    @NotBlank(message = "Vui lòng nhập tên công việc!")
    private String name;

    @NotNull(message = "Vui lòng nhập mức lương tối thiểu!")
    @Min(value=10, message = "Mức lương tối thiểu lớn hơn 10$!")
    @Max(value=1000000, message = "Mức lương tối thiểu bé hơn 1,000,000$!")
    private Long minSalary;


    @NotNull(message = "Vui lòng nhập mức lương tối đa!")
    @Min(value=10, message = "Mức lương tối đa lớn hơn 10$!")
    @Max(value=1000000, message = "Mức lương tối đa bé hơn 1,000,000$!")
    private Long maxSalary;


    @NotBlank(message = "Vui lòng chọn vị trí công việc!")
    private JobPosition position;

    @NotBlank(message = "Vui lòng chọn hình thức làm việc!")
    private JobWorkstyle workstyle;

    private String address;
    private String location;

    private List<String> tags;

    @NotBlank(message = "Vui lòng chọn ảnh minh họa!")
    private List<String> images;

    private String description;

    @AssertTrue(message = "Mức lương tối đa lớn hơn mức lương tối thiểu!")
    public boolean isPriceRangeValid() {
        // If either value is null, we can't compare them.
        // We assume @NotNull is used on the fields if they are required.
        // Returning true here lets the @NotNull validation handle the error.
        if (minSalary == null || maxSalary == null) {
            return true; 
        }

        // The actual comparison
        return maxSalary.compareTo(minSalary) >= 0;
    }
}
