package com.example.demo.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.request.CVCreationRequest;
import com.example.demo.dto.response.CVResponse;
import com.example.demo.dto.request.CVEditRequest;
import com.example.demo.enums.CVStatus;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.repository.CVRepository;
import com.example.demo.services.CVService;
import com.example.demo.services.JobService;
import com.example.demo.services.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CVServiceImpl implements CVService {

    private final CVRepository cvRepository;
    private final UserService userService;
    private final JobService jobService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CV addCV(CVCreationRequest request, Long accountID, Long jobID) {
        log.info("Account {} is applying for Job {}", accountID, jobID);
        CVId id = new CVId(accountID, jobID);
        
        if (cvRepository.existsById(id)) {
            log.warn("Apply failed: Account {} already applied for Job {}", accountID, jobID);
            throw new BadRequestException("Bạn đã ứng tuyển công việc này rồi!");
        }

        Account account = userService.getUserById(accountID);
        Job job = jobService.getJobByID(jobID)
                .orElseThrow(() -> {
                    log.warn("Apply failed: Job {} not found", jobID);
                    return new ResourceNotFoundException("Công việc không tồn tại!");
                });

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

        int currentCount = job.getAppliedCount() != null ? job.getAppliedCount() : 0;
        job.setAppliedCount(currentCount + 1);

        CV savedCv = cvRepository.save(cv);
        log.info("CV applied successfully for Account {} on Job {}", accountID, jobID);
        return savedCv;
    }

    @Override
    public CV editCV(CVEditRequest request, Long accountID, Long jobID) {
        log.info("Editing CV for Account {} on Job {}", accountID, jobID);
        CVId id = new CVId(accountID, jobID);
        CV cv = cvRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CV để sửa!"));

        cv.setName(request.getName());
        cv.setPhone(request.getPhone());
        cv.setEmail(request.getEmail());
        cv.setCvFile(request.getCvFile());
        cv.setReferral(request.getReferral());
        cv.setStatus(request.getStatus());
        return cvRepository.save(cv);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCV(Long jobID, Long accountID) {
        log.info("Deleting CV for Account {} on Job {}", accountID, jobID);
        CVId id = new CVId(accountID, jobID);
        CV cv = cvRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CV để xóa!"));

        cvRepository.delete(cv);
        log.info("CV deleted successfully for Account {} on Job {}", accountID, jobID);
    }

    @Override
    public List<CV> getCVByUserID(Long userID) {
        log.info("Fetching CVs for user {}", userID);
        Account user = userService.getUserById(userID);
        return cvRepository.findByAccount(user);
    }

    @Override
    public List<CV> getCVByJobID(Long jobID) {
        log.info("Fetching CVs for job {}", jobID);
        Job job = jobService.getJobByID(jobID)
                .orElseThrow(() -> new ResourceNotFoundException("Job không tồn tại"));
        
        return cvRepository.findByJob(job);
    }

    @Override
    public CV getCVDetail(Long jobId, Long accountId) {
        log.info("Fetching CV detail for Job {} and Account {}", jobId, accountId);
        CVId id = new CVId(accountId, jobId);
        return cvRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CV!"));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CV updateCVStatus(Long jobId, Long accountId, CVStatus newStatus) {
        log.info("Updating CV status for Job {} and Account {} to {}", jobId, accountId, newStatus);
        CVId id = new CVId(accountId, jobId);
        CV cv = cvRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CV!"));

        cv.setStatus(newStatus);
        return cvRepository.save(cv);
    }
    
    @Override
    public CVResponse toDTO(CV cv) {
        Account company = userService.getUserById(cv.getJob().getCompanyID());
        return new CVResponse(
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

