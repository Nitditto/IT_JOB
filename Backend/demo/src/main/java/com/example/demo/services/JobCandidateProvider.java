package com.example.demo.services;

import java.util.List;

import com.example.demo.model.Account;
import com.example.demo.model.Job;

public interface JobCandidateProvider {
    /**
     * Retrieves a candidate pool of jobs (typically 50-200) for a given candidate user
     * using profile matching (skills, position, location) with multi-tier fallback to
     * recent active jobs.
     */
    List<Job> findCandidates(Account candidate, int limit);
}
