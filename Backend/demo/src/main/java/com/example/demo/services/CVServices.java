package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.CVDTO;
import com.example.demo.enums.CVStatus;
import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.repository.CVRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CVServices {

    private final CVRepository cvRepository;
    private final UserServices userServices;
    private final JobServices jobServices;

    public CV addCV(CVDTO request) {
        CVId id = new CVId(request.getAccountID(), request.getJobID());
        Account account = userServices.getUserById(request.getAccountID());
        Job job = jobServices.getJobByID(request.getJobID()).get();
        // CV cv = new CV(id, account, job, request.getName(), request.getPhone(), request.getCvFile(), request.getReferral());

        CV cv = new CV();
        cv.setId(id);
        cv.setAccount(account);
        cv.setJob(job);
        cv.setName(request.getName());
        cv.setPhone(request.getPhone());
        cv.setCvFile(request.getCvFile());
        cv.setReferral(request.getReferral());
        cv.setStatus(CVStatus.PENDING);
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

        return cvRepository.findByAccount(user);
    }

    public List<CV> getCVByJobID(Long jobID) {
        Job job = jobServices.getJobByID(jobID)
            .orElseThrow(() -> new RuntimeException("Job không tồn tại")); // Thêm check tồn tại
        
        return cvRepository.findByJob(job);
    }

    public CV getCVDetail(Long jobId, Long accountId) {
        CVId id = new CVId(accountId, jobId);
        return cvRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CV!"));
    }

    public CV updateCVStatus(Long jobId, Long accountId, CVStatus newStatus) {
        CVId id = new CVId(accountId, jobId); // Chú ý thứ tự tham số của CVId constructor
        CV cv = cvRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy CV!"));

        cv.setStatus(newStatus);
        return cvRepository.save(cv);
    }
}
