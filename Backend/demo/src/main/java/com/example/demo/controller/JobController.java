package com.example.demo.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.JobCardDTO;
import com.example.demo.dto.JobCreationRequest;
import com.example.demo.dto.JobFilterDTO;
import com.example.demo.dto.UserDTO;
import com.example.demo.model.Job;
import com.example.demo.repository.JobRepository;
import com.example.demo.services.JobServices;
import com.example.demo.services.UserServices;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/job")
public class JobController {

    private final JobServices jobServices;
    private final UserServices userServices;


    @PostMapping("/create")
    @PreAuthorize("hasRole('COMPANY')")
    public Job create(@RequestBody JobCreationRequest job, Principal principal) {

        UserDTO company = userServices.getCurrentUser(principal); 
        
        return jobServices.createJob(job, company);
    }


    @GetMapping("/count")
    public Long count() {
        return jobServices.getJobCount();
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
    // public List<JobCardDTO> search(@RequestParam(required = false) Long companyId) {
    //     if (companyId != null) {
    //         return jobServices.getJobByCompanyID(companyId)
    //         .stream()
    //         .map(jobServices::toCard)
    //         .collect(Collectors.toList());
    //     } else return jobServices.getAllJobs()
    //     .stream()
    //     .map(jobServices::toCard)
    //     .collect(Collectors.toList());
    // }
    
}