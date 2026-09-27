package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.model.Account;
import com.example.demo.model.Job;

/**
 * Chiến lược gợi ý job cho candidate. Tách interface để dễ thêm cách gợi ý khác
 * (ví dụ embedding-based, xem ROADMAP Phase 4.5) mà không đụng {@code JobController}.
 */
public interface JobRecommender {
    List<JobRecommendationResponse> recommendJobs(Account candidate, List<Job> jobs, int limit);
}
