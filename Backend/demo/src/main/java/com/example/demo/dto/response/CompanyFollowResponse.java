package com.example.demo.dto.response;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CompanyFollowResponse {
    private Long id;
    private Instant createdAt;
    private CompanyResponse company;
}
