package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.JobCardDTO;
import com.example.demo.dto.JobCreationRequest;
import com.example.demo.dto.JobFilterDTO;
import com.example.demo.dto.TagDTO;
import com.example.demo.dto.UserDTO;
import com.example.demo.model.Job;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.LocationRepository;
import com.example.demo.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class JobServices {
    private final JobRepository jobRepository;
    private final LocationRepository locationRepository;
    private final UserServices userServices;
    public Job createJob(JobCreationRequest request, UserDTO company) {
        Job job = new Job();
        job.setCompanyID(company.getId());
        job.setName(request.getName());
        job.setMinSalary(request.getMinSalary());
        job.setMaxSalary(request.getMaxSalary());
        job.setDescription(request.getDescription());
        job.setImages(request.getImages());
        job.setLocation(locationRepository.findByAbbreviation(request.getLocation()).orElseGet(()->company.getLocation()));
        job.setAddress(request.getAddress());
        job.setPosition(request.getPosition());
        job.setWorkstyle(request.getWorkstyle());
        job.setTags(request.getTags());

        return jobRepository.save(job);
    }

    public JobCardDTO toCard(Job job) {
        JobCardDTO card = new JobCardDTO();
        UserDTO company = userServices.getUserById(job.getCompanyID());
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
        card.setTags(job.getTags());

        return card;
    }

    public long getJobCount() {
        // TESTING PURPOSES ONLY
        return jobRepository.count();
    }

    public List<Job> getJobByCompanyID(Long companyId) {
        return jobRepository.findByCompanyID(companyId);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<TagDTO> getAllTags() {
        return jobRepository.findAllTags();
    }

    public List<Job> searchJobsByFilters(JobFilterDTO filters) {
        // Gọi thẳng xuống Repository, nơi sẽ xử lý logic Criteria (Bước 4)
        return jobRepository.findJobsByFilters(filters);
    }
}
