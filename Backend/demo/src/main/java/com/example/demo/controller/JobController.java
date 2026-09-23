package com.example.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.request.JobCreationRequest;
import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.dto.response.JobResponse;
import com.example.demo.dto.response.TagResponse;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.services.JobService;
import com.example.demo.services.JobRecommender;
import com.example.demo.services.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/jobs")
@Slf4j
public class JobController {

    private final JobService jobService;
    private final UserService userService;
    private final JobRecommender jobRecommender;

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<JobRecommendationResponse>>> getRecommendations(
            @AuthenticationPrincipal Account currentUser) {
        log.info("REST request to get job recommendations for user: {}", currentUser.getEmail());
        List<Job> allJobs = jobService.getAllJobs();
        List<JobRecommendationResponse> recommendations = jobRecommender.recommendJobs(currentUser, allJobs, 10);
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }

    @PostMapping
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<ApiResponse<JobResponse>> create(@Valid @RequestBody JobCreationRequest jobRequest, Principal principal) {
        log.info("REST request to create job: {}", jobRequest.getName());
        CompanyResponse company = userService.convertToCompany(userService.getCurrentUser(principal));
        Job createdJob = jobService.createJob(jobRequest, company);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(jobService.toResponse(createdJob)));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> count() {
        log.info("REST request to get total job count");
        return ResponseEntity.ok(ApiResponse.success(jobService.getJobCount()));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getTags() {
        log.info("REST request to get all job tags");
        return ResponseEntity.ok(ApiResponse.success(jobService.getAllTags()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobCardResponse>>> search(@ModelAttribute JobFilterRequest filters) {
        log.info("REST request to search jobs with filters: {}", filters);
        List<Job> filteredJobs = jobService.searchJobsByFilters(filters);
        List<JobCardResponse> cards = jobService.toCardList(filteredJobs);
        return ResponseEntity.ok(ApiResponse.success(cards));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobResponse>> getJobInfo(@PathVariable Long id) {
        log.info("REST request to get job detail: {}", id);
        return ResponseEntity.ok(ApiResponse.success(jobService.getCachedJobResponse(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<ApiResponse<JobResponse>> editJob(@PathVariable Long id, @Valid @RequestBody JobEditRequest jobEditRequest) {
        log.info("REST request to edit job ID: {}", id);
        // Đảm bảo ID trong path và body khớp nhau
        jobEditRequest.setJobID(id);
        Job updatedJob = jobService.editJob(jobEditRequest);
        return ResponseEntity.ok(ApiResponse.success(jobService.toResponse(updatedJob)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<ApiResponse<Void>> deleteJob(@PathVariable Long id, Principal principal) {
        log.info("REST request to delete job ID: {}", id);
        Long currentCompanyId = userService.getCurrentUser(principal).getId();
        jobService.deleteJob(id, currentCompanyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa công việc thành công!"));
    }
}
