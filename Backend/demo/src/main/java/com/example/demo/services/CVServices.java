package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.dto.CVDTO;
import com.example.demo.model.Account;
import com.example.demo.repository.CVRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class CVServices {
    private final CVRepository cvRepository;
    private final UserServices userServices;
    private final JobServices jobServices;

    public CV addCV(CVDTO request) {
        CVId id = new CVId(request.getAccountID(), request.getJobID());
        Account account = userServices.getUserById(request.getAccountID());
        Job job = jobServices.getJobByID(request.getJobID()).get();
        CV cv = new CV(id,account,job,request.getName(),request.getPhone(),request.getCvFile(), request.getReferral());

        return cvRepository.save(cv);
    }

    public CV editCV(CVDTO request) {
        CVId id = new CVId(request.getAccountID(), request.getJobID());
        CV cv = cvRepository.findById(id).get();

        cv.setName(request.getName());
        cv.setPhone(request.getPhone());
        cv.setCvFile(request.getCvFile());
        cv.setReferral(request.getReferral());
        
        return cvRepository.save(cv);
    }

    public List<CV> getCVByUserID(Long userID) {
        Account user = userServices.getUserById(userID);

        return cvRepository.findByUser(user);
    }

    public List<CV> getCVByJobID(Long jobID) {
        Job job = jobServices.getJobByID(jobID).get();
        
        return cvRepository.findByJob(job);
    }
}
