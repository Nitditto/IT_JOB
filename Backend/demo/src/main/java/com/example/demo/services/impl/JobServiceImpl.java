package com.example.demo.services.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.request.JobCreationRequest;
import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.dto.response.TagResponse;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Job;
import com.example.demo.repository.CVRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.LocationRepository;
import com.example.demo.services.JobService;
import com.example.demo.services.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final LocationRepository locationRepository;
    private final UserService userService;
    private final CVRepository cvRepository; 

    @Override
    @Transactional
    public Job createJob(JobCreationRequest request, CompanyResponse company) {
        log.info("Company {} is creating a new job: {}", company.getId(), request.getName());
        Job job = new Job();
        job.setCompanyID(company.getId());
        job.setName(request.getName());
        job.setMinSalary(request.getMinSalary());
        job.setMaxSalary(request.getMaxSalary());
        job.setDescription(request.getDescription());
        
        if (request.getImages() != null) {
            job.setImages(new HashSet<>(request.getImages()));
        }
        
        job.setLocation(locationRepository.findByAbbreviation(request.getLocation()).orElseGet(company::getLocation));
        job.setAddress(request.getAddress());
        job.setPosition(request.getPosition());
        job.setWorkstyle(request.getWorkstyle());
        
        if (request.getTags() != null) {
            job.setTags(new HashSet<>(request.getTags()));
        }

        Job savedJob = jobRepository.save(job);
        log.info("Job {} created successfully with ID {}", savedJob.getName(), savedJob.getId());
        return savedJob;
    }

    @Override
    @Transactional
    public Job editJob(JobEditRequest jobEditRequest) {
        log.info("Editing Job with ID {}", jobEditRequest.getJobID());
        Job job = jobRepository.findById(jobEditRequest.getJobID())
                .orElseThrow(() -> {
                    log.warn("Job Edit failed: Job {} not found", jobEditRequest.getJobID());
                    return new ResourceNotFoundException("Công việc không tồn tại!");
                });
        job.setName(jobEditRequest.getName());
        job.setMinSalary(jobEditRequest.getMinSalary());
        job.setMaxSalary(jobEditRequest.getMaxSalary());
        job.setPosition(jobEditRequest.getPosition());
        job.setWorkstyle(jobEditRequest.getWorkstyle());
        job.setAddress(jobEditRequest.getAddress());
        job.setLocation(locationRepository.findByAbbreviation(jobEditRequest.getLocation())
                .orElseThrow(() -> new ResourceNotFoundException("Địa điểm không tồn tại!")));
        
        if (jobEditRequest.getTags() != null) {
            job.setTags(new HashSet<>(jobEditRequest.getTags()));
        } else {
            job.setTags(new HashSet<>());
        }
        
        if (jobEditRequest.getImages() != null) {
            job.setImages(new HashSet<>(jobEditRequest.getImages()));
        } else {
            job.setImages(new HashSet<>());
        }
        
        job.setDescription(jobEditRequest.getDescription());

        return jobRepository.save(job);
    }

    @Override
    public JobCardResponse toCard(Job job) {
        JobCardResponse card = new JobCardResponse();
        CompanyResponse company = userService.convertToCompany(userService.getUserById(job.getCompanyID()));
        card.setId(job.getId());
        card.setName(job.getName());
        card.setCompanyID(job.getCompanyID());
        card.setCompanyName(company.getName());
        card.setCompanyAvatar(company.getAvatar());
        card.setLocation(job.getLocation());
        card.setMinSalary(job.getMinSalary());
        card.setMaxSalary(job.getMaxSalary());
        card.setPosition(job.getPosition());
        card.setWorkstyle(job.getWorkstyle());
        
        if (job.getTags() != null) {
            card.setTags(new ArrayList<>(job.getTags()));
        } else {
            card.setTags(new ArrayList<>());
        }

        return card;
    }

    @Override
    public long getJobCount() {
        log.info("Getting total job count");
        return jobRepository.count();
    }

    @Override
    public List<Job> getJobByCompanyID(Long companyId) {
        log.info("Fetching jobs for company ID {}", companyId);
        return jobRepository.findByCompanyID(companyId);
    }

    @Override
    public Optional<Job> getJobByID(Long jobID) {
        log.info("Fetching Job by ID {}", jobID);
        return jobRepository.findById(jobID);
    }

    @Override
    public List<Job> getAllJobs() {
        log.info("Fetching all jobs");
        return jobRepository.findAll();
    }

    @Override
    public List<TagResponse> getAllTags() {
        log.info("Fetching all tags");
        return jobRepository.findAllTags();
    }

    @Override
    public List<Job> searchJobsByFilters(JobFilterRequest filters) {
        log.info("Searching jobs with filters: {}", filters);
        return jobRepository.findAll(com.example.demo.repository.specification.JobSpecification.withFilters(filters));
    }

    @Override
    @Transactional
    public void deleteJob(Long jobId, Long companyId) {
        log.info("Attempting to delete Job {} by Company {}", jobId, companyId);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> {
                    log.warn("Job delete failed: Job {} not found", jobId);
                    return new ResourceNotFoundException("Công việc không tồn tại!");
                });

        if (!job.getCompanyID().equals(companyId)) {
            log.warn("Job delete failed: Company {} is not the owner of Job {}", companyId, jobId);
            throw new BadRequestException("Bạn không có quyền xóa công việc này!");
        }

        cvRepository.deleteAllByJobId(jobId); 
        jobRepository.delete(job);
        log.info("Job {} deleted successfully", jobId);
    }
}

