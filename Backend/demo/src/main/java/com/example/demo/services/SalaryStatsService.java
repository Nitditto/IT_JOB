package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.response.SalaryStatResponse;

public interface SalaryStatsService {

    List<SalaryStatResponse> getTopSalaryStatsByTag(int limit);
}
