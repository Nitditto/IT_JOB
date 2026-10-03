package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserJobStateResponse {
    private Long jobId;
    private Boolean saved;
    private Boolean applied;
}
