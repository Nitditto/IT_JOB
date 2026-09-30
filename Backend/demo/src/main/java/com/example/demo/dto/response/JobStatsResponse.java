package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JobStatsResponse {
    private Long jobId;
    private Long totalViews;
    private Long viewsLast7Days;
    private Long savedCount;
    private Integer appliedCount;
}
