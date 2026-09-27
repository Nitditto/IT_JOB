package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.request.JobCreationRequest;
import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.dto.response.JobResponse;
import com.example.demo.dto.response.TagResponse;
import com.example.demo.model.Job;

public interface JobService {
    Job createJob(JobCreationRequest request, CompanyResponse company);
    Job editJob(JobEditRequest jobEditRequest);
    JobResponse toResponse(Job job);
    /** Đọc qua Redis cache (read-through, xem {@code JobRedisRepository}) — chỉ dùng cho
     *  endpoint đọc thuần (GET job detail), KHÔNG dùng khi cần entity JPA-managed để tiếp tục
     *  mutate/save (ví dụ tăng appliedCount) — dùng {@link #getJobByID} cho trường hợp đó. */
    JobResponse getCachedJobResponse(Long jobId);
    List<JobCardResponse> toCardList(List<Job> jobs);
    long getJobCount();
    List<Job> getJobByCompanyID(Long companyId);
    Optional<Job> getJobByID(Long jobID);
    List<Job> getAllJobs();
    List<TagResponse> getAllTags();
    List<Job> searchJobsByFilters(JobFilterRequest filters);
    void deleteJob(Long jobId, Long companyId);
}

