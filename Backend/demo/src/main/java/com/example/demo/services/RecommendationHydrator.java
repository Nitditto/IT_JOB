package com.example.demo.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.response.JobRecommendationItemDto;
import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.model.Job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecommendationHydrator {

    private final JobService jobService;

    /**
     * Hydrates compact Redis DTOs into full JobRecommendationResponse cards.
     * Uses a single bulk SQL query (findAllByIds) to eliminate N+1 lookup overhead
     * while preserving recommendation score ordering.
     */
    public List<JobRecommendationResponse> hydrateRecommendations(List<JobRecommendationItemDto> items) {
        if (items == null || items.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> jobIds = items.stream()
                .map(JobRecommendationItemDto::getJobId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        if (jobIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Job> jobs = jobService.findAllByIds(jobIds);

        Map<Long, JobCardResponse> cardMap = jobService.toCardList(jobs).stream()
                .collect(Collectors.toMap(JobCardResponse::getId, c -> c, (a, b) -> a));

        List<JobRecommendationResponse> responses = new ArrayList<>();
        for (JobRecommendationItemDto item : items) {
            JobCardResponse card = cardMap.get(item.getJobId());
            if (card != null) {
                responses.add(new JobRecommendationResponse(card, item.getMatchPercentage()));
            }
        }
        return responses;
    }
}
