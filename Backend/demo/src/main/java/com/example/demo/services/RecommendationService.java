package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.model.Account;

public interface RecommendationService {
    List<JobRecommendationResponse> getRecommendations(Account user);
}
