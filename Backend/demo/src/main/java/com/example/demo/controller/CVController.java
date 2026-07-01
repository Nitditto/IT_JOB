package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.CVCreationRequest;
import com.example.demo.dto.response.CVResponse;
import com.example.demo.dto.request.CVEditRequest;
import com.example.demo.enums.CVStatus;
import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.services.CVService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping
@Slf4j
public class CVController {
    
    private final CVService cvService;

    // Lấy CV của ứng viên đăng nhập đối với 1 Job cụ thể
    @GetMapping("/jobs/{jobID}/cvs/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CVResponse> getCVFromJob(@PathVariable Long jobID, @AuthenticationPrincipal Account user) {
        log.info("REST request to get CV for Job {} by user {}", jobID, user.getEmail());
        CV cv = cvService.getCVDetail(jobID, user.getId());
        return ResponseEntity.ok(cvService.toDTO(cv));
    }
    
    // Ứng viên nộp CV cho 1 Job
    @PostMapping("/jobs/{jobID}/cvs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CVResponse> apply(@PathVariable Long jobID, @Valid @RequestBody CVCreationRequest request, @AuthenticationPrincipal Account account) {
        log.info("REST request to apply CV for Job {} by user {}", jobID, account.getEmail());
        CV cv = cvService.addCV(request, account.getId(), jobID);
        return ResponseEntity.status(HttpStatus.CREATED).body(cvService.toDTO(cv));
    }

    // Ứng viên sửa CV đã nộp
    @PutMapping("/jobs/{jobID}/cvs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CVResponse> edit(@PathVariable Long jobID, @Valid @RequestBody CVEditRequest request, @AuthenticationPrincipal Account account) {
        log.info("REST request to edit CV for Job {} by user {}", jobID, account.getEmail());
        CV cv = cvService.editCV(request, account.getId(), jobID);
        return ResponseEntity.ok(cvService.toDTO(cv));
    }
    
    // Ứng viên rút CV đã nộp
    @DeleteMapping("/jobs/{jobID}/cvs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<String> delete(@PathVariable Long jobID, @AuthenticationPrincipal Account account) {
        log.info("REST request to delete CV for Job {} by user {}", jobID, account.getEmail());
        cvService.deleteCV(jobID, account.getId());
        return ResponseEntity.ok("Đã rút CV thành công!");
    }

    // Nhà tuyển dụng lấy danh sách CV ứng tuyển vào Job của mình
    @GetMapping("/jobs/{jobID}/cvs")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<List<CVResponse>> getJobCVs(@PathVariable("jobID") Long jobID) {
        log.info("REST request for Company to get all CVs for Job {}", jobID);
        List<CVResponse> cvs = cvService.getCVByJobID(jobID).stream()
                .map(cvService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cvs);
    }
    
    // Ứng viên xem lại danh sách tất cả các CV mình đã nộp
    @GetMapping("/cvs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<CVResponse>> getUserCVs(@AuthenticationPrincipal Account account) {
        log.info("REST request for Candidate {} to get their CV history", account.getEmail());
        List<CVResponse> cvs = cvService.getCVByUserID(account.getId()).stream()
                .map(cvService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cvs);
    }
    
    // Nhà tuyển dụng xem chi tiết 1 CV của ứng viên
    @GetMapping("/jobs/{jobId}/cvs/accounts/{accountId}")
    @PreAuthorize("hasRole('COMPANY')") 
    public ResponseEntity<CVResponse> getCVDetailForCompany(
            @PathVariable Long jobId,      
            @PathVariable Long accountId   
    ) {
        log.info("REST request for Company to get CV detail for Job {} and Candidate {}", jobId, accountId);
        CV cv = cvService.getCVDetail(jobId, accountId);
        return ResponseEntity.ok(cvService.toDTO(cv));
    }

    // Nhà tuyển dụng cập nhật trạng thái duyệt CV (PENDING, APPROVED, REJECTED...)
    @PatchMapping("/jobs/{jobId}/cvs/accounts/{accountId}/status")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<String> updateStatus(
            @PathVariable Long jobId, 
            @PathVariable Long accountId,
            @RequestParam("status") String statusStr
    ) {
        log.info("REST request for Company to update CV status for Job {} and Candidate {} to {}", jobId, accountId, statusStr);
        CVStatus status = CVStatus.valueOf(statusStr.toUpperCase());
        cvService.updateCVStatus(jobId, accountId, status);
        return ResponseEntity.ok("Cập nhật trạng thái CV thành công!");
    }
}


