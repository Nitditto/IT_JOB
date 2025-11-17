package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.CV;
import com.example.demo.model.Job;
import com.example.demo.model.User;
import com.example.demo.repository.CVRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class CVServices {
    private final CVRepository cvRepository;
    private final UserServices userServices;
    private final JobServices jobServices;

    public List<CV> getCVByUserID(Long userID) {
        User user = userServices.getUserById(userID);

        return cvRepository.findByUser(user);
    }

    public List<CV> getCVByJobID(Long jobID) {
        Job job = jobServices.getJobByID(jobID).get();
        
        return cvRepository.findByJob(job);
    }
}
