package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.request.JobCreationRequest;
import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.dto.response.TagResponse;
import com.example.demo.model.Job;

public interface JobService {
    Job createJob(JobCreationRequest request, CompanyResponse company);
    Job editJob(JobEditRequest jobEditRequest);
    JobCardResponse toCard(Job job);
    long getJobCount();
    List<Job> getJobByCompanyID(Long companyId);
    Optional<Job> getJobByID(Long jobID);
    List<Job> getAllJobs();
    List<TagResponse> getAllTags();
    List<Job> searchJobsByFilters(JobFilterRequest filters);
    void deleteJob(Long jobId, Long companyId);
}

