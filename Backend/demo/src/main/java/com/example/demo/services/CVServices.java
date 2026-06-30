package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.CVCreationRequest;
import com.example.demo.dto.CVDTO;
import com.example.demo.dto.CVEditRequest;
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

    @Transactional(rollbackFor = Exception.class)
    public CV addCV(CVCreationRequest request, Long accountID, Long jobID) {
        CVId id = new CVId(accountID, jobID);
        
        // 1. Kiểm tra trùng lặp ứng tuyển
        if (cvRepository.existsById(id)) {
            throw new IllegalStateException("Bạn đã ứng tuyển công việc này rồi!");
        }

        Account account = userServices.getUserById(accountID);
        Job job = jobServices.getJobByID(jobID)
                .orElseThrow(() -> new RuntimeException("Công việc không tồn tại!"));

        // 2. Tạo thực thể CV
        CV cv = new CV();
        cv.setId(id);
        cv.setAccount(account);
        cv.setJob(job);
        cv.setName(request.getName());
        cv.setPhone(request.getPhone());
        cv.setEmail(request.getEmail());
        cv.setCvFile(request.getCvFile());
        cv.setReferral(request.getReferral());
        cv.setStatus(CVStatus.PENDING);

        // 3. Tăng số lượng appliedCount của Job (ACID Transaction)
        int currentCount = job.getAppliedCount() != null ? job.getAppliedCount() : 0;
        job.setAppliedCount(currentCount + 1);

        return cvRepository.save(cv);
    }

    public CV editCV(CVEditRequest request, Long accountID, Long jobID) {
        CVId id = new CVId(accountID, jobID);
        CV cv = cvRepository.findById(id).get();

        cv.setName(request.getName());
        cv.setPhone(request.getPhone());
        cv.setEmail(request.getEmail());
        cv.setCvFile(request.getCvFile());
        cv.setReferral(request.getReferral());
        cv.setStatus(request.getStatus());
        return cvRepository.save(cv);
    }

    public void deleteCV(Long jobID, Long accountID) {
        CVId id = new CVId(accountID, jobID);
        CV cv = cvRepository.findById(id).orElseThrow();

        cvRepository.delete(cv);
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
    
    public CVDTO toDTO(CV cv) {
        Account company = userServices.getUserById(cv.getJob().getCompanyID());
        return new CVDTO(
            cv.getAccount().getId(),
            cv.getJob().getId(),
            cv.getName(),
            cv.getPhone(),
            cv.getEmail(),
            cv.getCvFile(),
            cv.getReferral(),
            cv.getStatus(),
            cv.getJob().getName(),
            company.getName(),
            cv.getJob().getMinSalary(),
            cv.getJob().getMaxSalary(),
            cv.getJob().getPosition(),
            cv.getJob().getWorkstyle()
            );
    }
}
