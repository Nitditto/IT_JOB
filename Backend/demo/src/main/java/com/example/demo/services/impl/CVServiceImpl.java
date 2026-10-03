package com.example.demo.services.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.request.CVCreationRequest;
import com.example.demo.dto.response.CVResponse;
import com.example.demo.dto.request.CVEditRequest;
import com.example.demo.dto.request.UpdateCvStatusCommand;
import com.example.demo.enums.CVStatus;
import com.example.demo.enums.CvActor;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.repository.CVRepository;
import com.example.demo.services.CVService;
import com.example.demo.services.CvStatusTransitions;
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
            throw new BusinessException("Bạn đã ứng tuyển công việc này rồi!");
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
        cv.setCoverLetter(request.getCoverLetter());
        cv.setPortfolioUrl(request.getPortfolioUrl());
        cv.setExpectedSalary(request.getExpectedSalary());
        cv.setAvailableFrom(request.getAvailableFrom());
        cv.setStatus(CVStatus.PENDING);

        int currentCount = job.getAppliedCount() != null ? job.getAppliedCount() : 0;
        job.setAppliedCount(currentCount + 1);

        CV savedCv = cvRepository.save(cv);
        log.info("CV applied successfully for Account {} on Job {}", accountID, jobID);
        return savedCv;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
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
        cv.setCoverLetter(request.getCoverLetter());
        cv.setPortfolioUrl(request.getPortfolioUrl());
        cv.setExpectedSalary(request.getExpectedSalary());
        cv.setAvailableFrom(request.getAvailableFrom());
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
    public List<CV> getCVByJobID(final Long jobID, final Long companyId) {
        log.info("Fetching CVs for job {} by company {}", jobID, companyId);
        return cvRepository.findByJob(this.getOwnedJob(jobID, companyId));
    }

    @Override
    public CV getCVDetail(Long jobId, Long accountId) {
        log.info("Fetching CV detail for Job {} and Account {}", jobId, accountId);
        CVId id = new CVId(accountId, jobId);
        return cvRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy CV!"));
    }

    @Override
    public CV getCVDetailForCompany(final Long jobId, final Long accountId, final Long companyId) {
        this.getOwnedJob(jobId, companyId);
        return this.getCVDetail(jobId, accountId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CV updateCVStatus(final UpdateCvStatusCommand command) {
        log.info("Company {} updating CV status for Job {} and Account {} to {}",
                command.actorCompanyId(), command.jobId(), command.candidateId(), command.newStatus());
        this.getOwnedJob(command.jobId(), command.actorCompanyId());
        final CV cv = this.getCVDetail(command.jobId(), command.candidateId());
        if (cv.getStatus() == command.newStatus()) {
            return cv;
        }
        if (!CvStatusTransitions.isAllowed(CvActor.COMPANY, cv.getStatus(), command.newStatus())) {
            log.warn("Rejected CV status transition {} -> {}", cv.getStatus(), command.newStatus());
            throw new BusinessException(
                    "Không thể chuyển trạng thái CV từ " + cv.getStatus() + " sang " + command.newStatus() + "!");
        }
        cv.setStatus(command.newStatus());
        return cvRepository.save(cv);
    }

    private Job getOwnedJob(final Long jobId, final Long companyId) {
        final Job job = jobService.getJobByID(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job không tồn tại"));
        if (!job.getCompanyID().equals(companyId)) {
            log.warn("Company {} is not the owner of Job {}", companyId, jobId);
            throw new AccessDeniedException("Bạn không có quyền truy cập CV của công việc này!");
        }
        return job;
    }
    
    @Override
    public CVResponse toDTO(CV cv) {
        Account company = userService.getUserById(cv.getJob().getCompanyID());
        return buildResponse(cv, company);
    }

    @Override
    public List<CVResponse> toDTOList(List<CV> cvs) {
        if (cvs == null || cvs.isEmpty()) {
            return new ArrayList<>();
        }

        Set<Long> companyIds = cvs.stream().map(cv -> cv.getJob().getCompanyID()).collect(Collectors.toSet());
        Map<Long, Account> companyById = userService.getUsersByIds(companyIds);

        List<CVResponse> responses = new ArrayList<>();
        for (CV cv : cvs) {
            responses.add(buildResponse(cv, companyById.get(cv.getJob().getCompanyID())));
        }
        return responses;
    }

    private CVResponse buildResponse(CV cv, Account company) {
        return new CVResponse(
            cv.getAccount().getId(),
            cv.getJob().getId(),
            cv.getName(),
            cv.getPhone(),
            cv.getEmail(),
            cv.getCvFile(),
            cv.getReferral(),
            cv.getCoverLetter(),
            cv.getPortfolioUrl(),
            cv.getExpectedSalary(),
            cv.getAvailableFrom(),
            cv.getSubmittedAt(),
            cv.getUpdatedAt(),
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

