package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.SavedJobResponse;
import com.example.demo.dto.response.UserJobStateResponse;
import com.example.demo.model.Account;
import com.example.demo.services.SavedJobService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/jobs")
@Slf4j
public class SavedJobController {

    private final SavedJobService savedJobService;

    @PostMapping("/{jobId}/save")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<SavedJobResponse>> saveJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to save Job {}", account.getId(), jobId);
        return ResponseEntity.ok(ApiResponse.success(savedJobService.saveJob(jobId, account)));
    }

    @DeleteMapping("/{jobId}/save")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> unsaveJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to unsave Job {}", account.getId(), jobId);
        savedJobService.unsaveJob(jobId, account);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã bỏ lưu công việc!"));
    }

    @GetMapping("/saved")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<SavedJobResponse>>> getSavedJobs(@AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to get saved jobs", account.getId());
        return ResponseEntity.ok(ApiResponse.success(savedJobService.getSavedJobs(account)));
    }

    @GetMapping("/{jobId}/state")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<UserJobStateResponse>> getJobState(
            @PathVariable Long jobId,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to get state of Job {}", account.getId(), jobId);
        return ResponseEntity.ok(ApiResponse.success(savedJobService.getUserJobState(jobId, account)));
    }
}
