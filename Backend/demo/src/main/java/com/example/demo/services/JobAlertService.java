package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.request.JobAlertRequest;
import com.example.demo.dto.response.JobAlertResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.model.Account;

public interface JobAlertService {
    JobAlertResponse createAlert(JobAlertRequest request, Account account);
    JobAlertResponse updateAlert(Long alertId, JobAlertRequest request, Account account);
    void deleteAlert(Long alertId, Account account);
    List<JobAlertResponse> getAlerts(Account account);
    List<JobCardResponse> previewMatches(Long alertId, Account account);
}
