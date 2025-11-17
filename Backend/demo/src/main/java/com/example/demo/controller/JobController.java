package com.example.demo.controller;

import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.CompanyDTO;
import com.example.demo.dto.JobCardDTO;
import com.example.demo.dto.JobCreationRequest;
import com.example.demo.dto.JobEditRequest;
import com.example.demo.dto.JobFilterDTO;
import com.example.demo.dto.TagDTO;
import com.example.demo.model.Job;
import com.example.demo.services.JobServices;
import com.example.demo.services.UserServices;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequiredArgsConstructor
@RequestMapping("/job")
public class JobController {

    private final JobServices jobServices;
    private final UserServices userServices;


    @PostMapping("/create")
    @PreAuthorize("hasRole('COMPANY')")
    public Job create(@RequestBody JobCreationRequest job, Principal principal) {

        CompanyDTO company = userServices.convertToCompany(userServices.getCurrentUser(principal)); 
        
        return jobServices.createJob(job, company);
    }


    @GetMapping("/count")
    public Long count() {
        return jobServices.getJobCount();
    }
    
    @GetMapping("/tags")
    public List<TagDTO> getTags() {
        return jobServices.getAllTags();
    }
    

    @GetMapping("/search")
    public List<JobCardDTO> search(@ModelAttribute JobFilterDTO filters) {
        
        // 1. Gọi một phương thức service mới (bạn sẽ tạo ở bước 3)
        List<Job> filteredJobs = jobServices.searchJobsByFilters(filters);
        
        // 2. Dùng lại logic map DTO của bạn
        return filteredJobs.stream()
            .map(jobServices::toCard)
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Job getJobInfo(@PathVariable Long id) {
        Optional<Job> job = jobServices.getJobByID(id);
        if (job.isPresent()) {
            return job.get();
        } else {
            return new Job();
        }
    }
    

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public Job editJob(@PathVariable String id, @RequestBody JobEditRequest jobEditRequest) {
        return jobServices.editJob(jobEditRequest);
    }
    
}