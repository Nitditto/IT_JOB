package com.example.demo.services;

import org.springframework.stereotype.Service;

import com.example.demo.repository.JobRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class JobServices {
    private final JobRepository jobRepository;



    public long getJobCount() {
        // TESTING PURPOSES ONLY
        //return jobRepository.count();
        return 696969;
    }
}
