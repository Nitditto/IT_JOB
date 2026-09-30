package com.example.demo.services.impl;

import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.request.JobAlertRequest;
import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.dto.response.JobAlertResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.JobAlert;
import com.example.demo.repository.JobAlertRepository;
import com.example.demo.services.JobAlertService;
import com.example.demo.services.JobService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobAlertServiceImpl implements JobAlertService {

    private final JobAlertRepository jobAlertRepository;
    private final JobService jobService;

    @Override
    @Transactional
    public JobAlertResponse createAlert(JobAlertRequest request, Account account) {
        JobAlert alert = new JobAlert();
        alert.setAccount(account);
        applyRequest(alert, request);
        log.info("Account {} created JobAlert {}", account.getId(), request.getName());
        return toResponse(jobAlertRepository.save(alert));
    }

    @Override
    @Transactional
    public JobAlertResponse updateAlert(Long alertId, JobAlertRequest request, Account account) {
        JobAlert alert = getOwnedAlert(alertId, account);
        applyRequest(alert, request);
        log.info("Account {} updated JobAlert {}", account.getId(), alertId);
        return toResponse(jobAlertRepository.save(alert));
    }

    @Override
    @Transactional
    public void deleteAlert(Long alertId, Account account) {
        JobAlert alert = getOwnedAlert(alertId, account);
        jobAlertRepository.delete(alert);
        log.info("Account {} deleted JobAlert {}", account.getId(), alertId);
    }

    @Override
    public List<JobAlertResponse> getAlerts(Account account) {
        return jobAlertRepository.findByAccountOrderByCreatedAtDesc(account).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<JobCardResponse> previewMatches(Long alertId, Account account) {
        JobAlert alert = getOwnedAlert(alertId, account);
        return jobService.toCardList(jobService.searchJobsByFilters(toFilter(alert)));
    }

    private void applyRequest(JobAlert alert, JobAlertRequest request) {
        alert.setName(request.getName());
        alert.setQuery(request.getQuery());
        alert.setLocation(request.getLocation());
        alert.setCategory(request.getCategory());
        alert.setIndustry(request.getIndustry());
        alert.setMinSalary(request.getMinSalary());
        alert.setMaxSalary(request.getMaxSalary());
        alert.setPosition(request.getPosition());
        alert.setWorkstyle(request.getWorkstyle());
        alert.setEmploymentType(request.getEmploymentType());
        alert.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());
        alert.setTags(request.getTags() != null ? new HashSet<>(request.getTags()) : new HashSet<>());
    }

    private JobFilterRequest toFilter(JobAlert alert) {
        JobFilterRequest filter = new JobFilterRequest();
        filter.setQuery(alert.getQuery());
        filter.setLocation(alert.getLocation());
        filter.setCategory(alert.getCategory());
        filter.setIndustry(alert.getIndustry());
        filter.setMinSalary(alert.getMinSalary() != null ? alert.getMinSalary().intValue() : null);
        filter.setMaxSalary(alert.getMaxSalary() != null ? alert.getMaxSalary().intValue() : null);
        filter.setPosition(alert.getPosition() != null ? List.of(alert.getPosition().name()) : null);
        filter.setWorkstyle(alert.getWorkstyle() != null ? List.of(alert.getWorkstyle().name()) : null);
        filter.setEmploymentType(alert.getEmploymentType() != null ? List.of(alert.getEmploymentType().name()) : null);
        filter.setTags(alert.getTags() != null ? List.copyOf(alert.getTags()) : null);
        filter.setStatus(List.of("published"));
        return filter;
    }

    private JobAlertResponse toResponse(JobAlert alert) {
        return new JobAlertResponse(
                alert.getId(),
                alert.getName(),
                alert.getQuery(),
                alert.getLocation(),
                alert.getCategory(),
                alert.getIndustry(),
                alert.getMinSalary(),
                alert.getMaxSalary(),
                alert.getPosition(),
                alert.getWorkstyle(),
                alert.getEmploymentType(),
                alert.getTags() != null ? List.copyOf(alert.getTags()) : List.of(),
                alert.getActive(),
                alert.getCreatedAt(),
                alert.getUpdatedAt());
    }

    private JobAlert getOwnedAlert(Long alertId, Account account) {
        JobAlert alert = jobAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo việc làm!"));
        if (!alert.getAccount().getId().equals(account.getId())) {
            throw new AccessDeniedException("Bạn không có quyền thao tác thông báo này!");
        }
        return alert;
    }
}
