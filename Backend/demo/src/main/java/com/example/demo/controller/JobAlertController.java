package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.JobAlertRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.JobAlertResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.model.Account;
import com.example.demo.services.JobAlertService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/job-alerts")
@PreAuthorize("hasRole('USER')")
@Slf4j
public class JobAlertController {

    private final JobAlertService jobAlertService;

    @PostMapping
    public ResponseEntity<ApiResponse<JobAlertResponse>> createAlert(
            @Valid @RequestBody JobAlertRequest request,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to create job alert", account.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(jobAlertService.createAlert(request, account)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobAlertResponse>>> getAlerts(@AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to get job alerts", account.getId());
        return ResponseEntity.ok(ApiResponse.success(jobAlertService.getAlerts(account)));
    }

    @PutMapping("/{alertId}")
    public ResponseEntity<ApiResponse<JobAlertResponse>> updateAlert(
            @PathVariable Long alertId,
            @Valid @RequestBody JobAlertRequest request,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to update JobAlert {}", account.getId(), alertId);
        return ResponseEntity.ok(ApiResponse.success(jobAlertService.updateAlert(alertId, request, account)));
    }

    @DeleteMapping("/{alertId}")
    public ResponseEntity<ApiResponse<Void>> deleteAlert(
            @PathVariable Long alertId,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to delete JobAlert {}", account.getId(), alertId);
        jobAlertService.deleteAlert(alertId, account);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa thông báo việc làm!"));
    }

    @GetMapping("/{alertId}/matches")
    public ResponseEntity<ApiResponse<List<JobCardResponse>>> previewMatches(
            @PathVariable Long alertId,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to preview matches for JobAlert {}", account.getId(), alertId);
        return ResponseEntity.ok(ApiResponse.success(jobAlertService.previewMatches(alertId, account)));
    }
}
