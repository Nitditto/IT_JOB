package com.example.demo.services.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.response.SavedJobResponse;
import com.example.demo.dto.response.UserJobStateResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.model.SavedJob;
import com.example.demo.repository.CVRepository;
import com.example.demo.repository.SavedJobRepository;
import com.example.demo.services.JobService;
import com.example.demo.services.SavedJobService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedJobServiceImpl implements SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobService jobService;
    private final CVRepository cvRepository;

    @Override
    @Transactional
    public SavedJobResponse saveJob(Long jobId, Account account) {
        Job job = getJob(jobId);
        return savedJobRepository.findByAccountAndJob(account, job)
                .map(this::toResponse)
                .orElseGet(() -> {
                    SavedJob savedJob = new SavedJob();
                    savedJob.setAccount(account);
                    savedJob.setJob(job);
                    log.info("Account {} saved Job {}", account.getId(), jobId);
                    return toResponse(savedJobRepository.save(savedJob));
                });
    }

    @Override
    @Transactional
    public void unsaveJob(Long jobId, Account account) {
        Job job = getJob(jobId);
        savedJobRepository.deleteByAccountAndJob(account, job);
        log.info("Account {} unsaved Job {}", account.getId(), jobId);
    }

    @Override
    public List<SavedJobResponse> getSavedJobs(Account account) {
        return savedJobRepository.findByAccountOrderByCreatedAtDesc(account).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserJobStateResponse getUserJobState(Long jobId, Account account) {
        Job job = getJob(jobId);
        boolean saved = savedJobRepository.existsByAccountAndJob(account, job);
        boolean applied = cvRepository.existsById(new CVId(account.getId(), jobId));
        return new UserJobStateResponse(jobId, saved, applied);
    }

    @Override
    public long countByJobId(Long jobId) {
        return savedJobRepository.countByJob(getJob(jobId));
    }

    private SavedJobResponse toResponse(SavedJob savedJob) {
        List<JobCardResponse> cards = jobService.toCardList(List.of(savedJob.getJob()));
        JobCardResponse card = cards.isEmpty() ? null : cards.get(0);
        return new SavedJobResponse(savedJob.getId(), savedJob.getCreatedAt(), card);
    }

    private Job getJob(Long jobId) {
        return jobService.getJobByID(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Công việc không tồn tại!"));
    }
}
