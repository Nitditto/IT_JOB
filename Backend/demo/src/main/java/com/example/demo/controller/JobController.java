package com.example.demo.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

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

import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.request.JobCreationRequest;
import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.dto.response.TagResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.services.JobService;
import com.example.demo.services.TfIdfRecommender;
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
    private final TfIdfRecommender tfIdfRecommender;

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<JobRecommendationResponse>> getRecommendations(
            @AuthenticationPrincipal Account currentUser) {
        log.info("REST request to get job recommendations for user: {}", currentUser.getEmail());
        List<Job> allJobs = jobService.getAllJobs();
        List<JobRecommendationResponse> recommendations = tfIdfRecommender.recommendJobs(currentUser, allJobs, 10);
        return ResponseEntity.ok(recommendations);
    }

    @PostMapping
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Job> create(@Valid @RequestBody JobCreationRequest jobRequest, Principal principal) {
        log.info("REST request to create job: {}", jobRequest.getName());
        CompanyResponse company = userService.convertToCompany(userService.getCurrentUser(principal)); 
        Job createdJob = jobService.createJob(jobRequest, company);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdJob);
    }

    @GetMapping("/count")
    public ResponseEntity<Long> count() {
        log.info("REST request to get total job count");
        return ResponseEntity.ok(jobService.getJobCount());
    }
    
    @GetMapping("/tags")
    public ResponseEntity<List<TagResponse>> getTags() {
        log.info("REST request to get all job tags");
        return ResponseEntity.ok(jobService.getAllTags());
    }

    @GetMapping
    public ResponseEntity<List<JobCardResponse>> search(@ModelAttribute JobFilterRequest filters) {
        log.info("REST request to search jobs with filters: {}", filters);
        List<Job> filteredJobs = jobService.searchJobsByFilters(filters);
        List<JobCardResponse> cards = filteredJobs.stream()
                .map(jobService::toCard)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cards);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobInfo(@PathVariable Long id) {
        log.info("REST request to get job detail: {}", id);
        Job job = jobService.getJobByID(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với ID: " + id));
        return ResponseEntity.ok(job);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Job> editJob(@PathVariable Long id, @Valid @RequestBody JobEditRequest jobEditRequest) {
        log.info("REST request to edit job ID: {}", id);
        // Đảm bảo ID trong path và body khớp nhau
        jobEditRequest.setJobID(id);
        Job updatedJob = jobService.editJob(jobEditRequest);
        return ResponseEntity.ok(updatedJob);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<String> deleteJob(@PathVariable Long id, Principal principal) {
        log.info("REST request to delete job ID: {}", id);
        Long currentCompanyId = userService.getCurrentUser(principal).getId();
        jobService.deleteJob(id, currentCompanyId);
        return ResponseEntity.ok("Xóa công việc thành công!");
    }
}

