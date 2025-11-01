package com.example.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.UserDTO;
import com.example.demo.model.Job;
import com.example.demo.repository.JobRepository;
import com.example.demo.services.UserServices;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "${allowed.cors.origins}")
public class JobController {

    private final JobRepository jobRepository;
    private final UserServices userServices;


    @PostMapping("/job/create")
    @PreAuthorize("hasRole('COMPANY')")
    public Job create(@RequestBody Job job, Principal principal) {

        UserDTO company = userServices.getCurrentUser(principal); 
        job.setCompanyID(company.getId());
        return jobRepository.save(job);
    }

    @GetMapping("/search")
    public List<Job> search(@RequestParam String name) {
        return jobRepository.findByNameContainingIgnoreCase(name);
    }
}