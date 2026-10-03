package com.example.demo.services;

import com.example.demo.dto.response.JobStatsResponse;
import com.example.demo.model.Account;

public interface JobViewService {
    void recordView(Long jobId, Account account, String ipAddress, String userAgent);
    JobStatsResponse getStats(Long jobId, Long companyId);
}
