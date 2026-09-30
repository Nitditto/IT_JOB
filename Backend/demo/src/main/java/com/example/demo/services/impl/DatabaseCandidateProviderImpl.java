package com.example.demo.services.impl;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.specification.JobSpecification;
import com.example.demo.services.JobCandidateProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseCandidateProviderImpl implements JobCandidateProvider {

    private final JobRepository jobRepository;

    @Override
    public List<Job> findCandidates(Account candidate, int limit) {
        if (candidate == null || limit <= 0) {
            return new ArrayList<>();
        }

        int targetLimit = Math.min(Math.max(limit, 50), 500);
        Set<Job> candidateSet = new LinkedHashSet<>();

        // Tier 1: Match by candidate's desired position / lookingfor if present
        String lookingFor = candidate.getLookingfor();
        if (lookingFor != null && !lookingFor.isBlank()) {
            JobFilterRequest filter = new JobFilterRequest();
            filter.setQuery(lookingFor.trim());
            try {
                List<Job> matchedJobs = jobRepository.findAll(
                        JobSpecification.withFilters(filter),
                        PageRequest.of(0, targetLimit, Sort.by(Sort.Direction.DESC, "id"))
                ).getContent();
                candidateSet.addAll(matchedJobs);
            } catch (Exception e) {
                log.warn("Error fetching candidate jobs by position keyword '{}': {}", lookingFor, e.getMessage());
            }
        }

        // Tier 2: Fallback / Supplement with recent jobs if pool is under target limit
        if (candidateSet.size() < targetLimit) {
            List<Job> recentJobs = jobRepository.findAll(
                    PageRequest.of(0, targetLimit, Sort.by(Sort.Direction.DESC, "id"))
            ).getContent();
            candidateSet.addAll(recentJobs);
        }

        List<Job> finalCandidates = new ArrayList<>(candidateSet);
        if (finalCandidates.size() > targetLimit) {
            finalCandidates = finalCandidates.subList(0, targetLimit);
        }

        log.debug("Found {} recommendation candidates for user ID {}", finalCandidates.size(), candidate.getId());
        return finalCandidates;
    }
}
