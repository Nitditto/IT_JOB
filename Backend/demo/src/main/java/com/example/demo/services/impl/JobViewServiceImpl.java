package com.example.demo.services.impl;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.JobStatsResponse;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.model.JobView;
import com.example.demo.repository.JobViewRepository;
import com.example.demo.services.JobService;
import com.example.demo.services.JobViewService;
import com.example.demo.services.SavedJobService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobViewServiceImpl implements JobViewService {

    private static final long VIEW_DEDUP_HOURS = 1;

    private final JobViewRepository jobViewRepository;
    private final JobService jobService;
    private final SavedJobService savedJobService;

    @Override
    @Transactional
    public void recordView(Long jobId, Account account, String ipAddress, String userAgent) {
        Job job = getJob(jobId);
        Instant threshold = Instant.now().minus(VIEW_DEDUP_HOURS, ChronoUnit.HOURS);
        boolean recentlyViewed = account != null
                ? jobViewRepository.findFirstByJobAndAccountAndViewedAtAfterOrderByViewedAtDesc(job, account, threshold).isPresent()
                : jobViewRepository.findFirstByJobAndIpAddressAndViewedAtAfterOrderByViewedAtDesc(job, ipAddress, threshold).isPresent();

        if (recentlyViewed) {
            return;
        }

        JobView view = new JobView();
        view.setJob(job);
        view.setAccount(account);
        view.setIpAddress(ipAddress);
        view.setUserAgent(userAgent);
        jobViewRepository.save(view);
        log.debug("Recorded view for Job {}", jobId);
    }

    @Override
    public JobStatsResponse getStats(Long jobId, Long companyId) {
        Job job = getJob(jobId);
        if (!job.getCompanyID().equals(companyId)) {
            throw new AccessDeniedException("Bạn không có quyền xem thống kê công việc này!");
        }

        long totalViews = jobViewRepository.countByJob(job);
        long viewsLast7Days = jobViewRepository.countByJobAndViewedAtAfter(job, Instant.now().minus(7, ChronoUnit.DAYS));
        long savedCount = savedJobService.countByJobId(jobId);
        return new JobStatsResponse(jobId, totalViews, viewsLast7Days, savedCount, job.getAppliedCount());
    }

    private Job getJob(Long jobId) {
        return jobService.getJobByID(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Công việc không tồn tại!"));
    }
}
