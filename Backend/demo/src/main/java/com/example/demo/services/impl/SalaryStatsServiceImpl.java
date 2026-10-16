package com.example.demo.services.impl;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.SalaryStatResponse;
import com.example.demo.enums.JobStatus;
import com.example.demo.repository.JobRepository;
import com.example.demo.services.SalaryStatsService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalaryStatsServiceImpl implements SalaryStatsService {

    private static final int MAX_LIMIT = 50;

    private final JobRepository jobRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SalaryStatResponse> getTopSalaryStatsByTag(final int limit) {
        final int boundedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        return this.jobRepository.findSalaryStatsByTag(JobStatus.published, PageRequest.of(0, boundedLimit));
    }
}
