package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.dto.CompanyDTO;
import com.example.demo.dto.JobCardDTO;
import com.example.demo.dto.JobCreationRequest;
import com.example.demo.dto.JobEditRequest;
import com.example.demo.dto.JobFilterDTO;
import com.example.demo.dto.TagDTO;
import com.example.demo.model.Job;
import com.example.demo.repository.CVRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.LocationRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class JobServices {
    private final JobRepository jobRepository;
    private final LocationRepository locationRepository;
    private final UserServices userServices;

    private final CVRepository cvRepository; 

    public Job createJob(JobCreationRequest request, CompanyDTO company) {
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

    public Job editJob(JobEditRequest jobEditRequest) {
        Job job = jobRepository.findById(jobEditRequest.getJobID()).orElseThrow();
        job.setName(jobEditRequest.getName());
        job.setMinSalary(jobEditRequest.getMinSalary());
        job.setMaxSalary(jobEditRequest.getMaxSalary());
        job.setPosition(jobEditRequest.getPosition());
        job.setWorkstyle(jobEditRequest.getWorkstyle());
        job.setAddress(jobEditRequest.getAddress());
        job.setLocation(locationRepository.findByAbbreviation(jobEditRequest.getLocation()).get());
        job.setTags(jobEditRequest.getTags());
        job.setImages(jobEditRequest.getImages());
        job.setDescription(jobEditRequest.getDescription());

        return jobRepository.save(job);
    }

    public JobCardDTO toCard(Job job) {
        JobCardDTO card = new JobCardDTO();
        CompanyDTO company = userServices.convertToCompany(userServices.getUserById(job.getCompanyID()));
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

    public Optional<Job> getJobByID(Long jobID) {
        return jobRepository.findById(jobID);
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

     @Transactional // <--- 3. Thêm Annotation này để đảm bảo xóa cả 2 thành công hoặc rollback
    public void deleteJob(Long jobId, Long companyId) {
        // Tìm job
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Công việc không tồn tại!"));

        // Check quyền
        if (!job.getCompanyID().equals(companyId)) {
            throw new RuntimeException("Bạn không có quyền xóa công việc này!");
        }

        // --- BƯỚC QUAN TRỌNG: Xóa CV trước ---
        // Bạn cần viết hàm deleteByJobId trong CvRepository nếu chưa có
        cvRepository.deleteAllByJobId(jobId); 

        // Sau đó mới xóa Job
        jobRepository.delete(job);
    }
}
