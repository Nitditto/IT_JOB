package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.response.SavedJobResponse;
import com.example.demo.dto.response.UserJobStateResponse;
import com.example.demo.model.Account;

public interface SavedJobService {
    SavedJobResponse saveJob(Long jobId, Account account);
    void unsaveJob(Long jobId, Account account);
    List<SavedJobResponse> getSavedJobs(Account account);
    UserJobStateResponse getUserJobState(Long jobId, Account account);
    long countByJobId(Long jobId);
}
