package com.example.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import lombok.RequiredArgsConstructor;

import com.example.demo.model.Job;
import com.example.demo.model.JobRepository;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "${allowed.cors.origins}")
public class JobController {

    private final JobRepository jobRepository;

    @PostMapping("/job/create")
    public Job create(@RequestBody Job job) {
        return jobRepository.save(job);
    }

    @GetMapping("/search")
    public List<Job> search(@RequestParam String name) {
        return jobRepository.findByNameContainingIgnoreCase(name);
    }
}