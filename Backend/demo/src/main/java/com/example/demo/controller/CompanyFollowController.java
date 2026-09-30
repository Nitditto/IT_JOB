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
import com.example.demo.dto.response.CompanyFollowResponse;
import com.example.demo.model.Account;
import com.example.demo.services.CompanyFollowService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/companies")
@Slf4j
public class CompanyFollowController {

    private final CompanyFollowService companyFollowService;

    @PostMapping("/{companyId}/follow")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<CompanyFollowResponse>> followCompany(
            @PathVariable Long companyId,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to follow Company {}", account.getId(), companyId);
        return ResponseEntity.ok(ApiResponse.success(companyFollowService.followCompany(companyId, account)));
    }

    @DeleteMapping("/{companyId}/follow")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> unfollowCompany(
            @PathVariable Long companyId,
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to unfollow Company {}", account.getId(), companyId);
        companyFollowService.unfollowCompany(companyId, account);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã bỏ theo dõi công ty!"));
    }

    @GetMapping("/following")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<CompanyFollowResponse>>> getFollowedCompanies(
            @AuthenticationPrincipal Account account) {
        log.info("REST request for Account {} to get followed companies", account.getId());
        return ResponseEntity.ok(ApiResponse.success(companyFollowService.getFollowedCompanies(account)));
    }

    @GetMapping("/{companyId}/followers/count")
    public ResponseEntity<ApiResponse<Long>> countFollowers(@PathVariable Long companyId) {
        log.info("REST request to count followers for Company {}", companyId);
        return ResponseEntity.ok(ApiResponse.success(companyFollowService.countFollowers(companyId)));
    }
}
