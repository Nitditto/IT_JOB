package com.example.demo.repository;

import java.util.ArrayList;
import java.util.List;

import com.example.demo.dto.JobFilterDTO;
import com.example.demo.model.Job;
import com.example.demo.model.Location; // <-- Thêm import

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join; // <-- Thêm import
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

public class JobRepositoryCustomImpl implements JobRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Job> findJobsByFilters(JobFilterDTO filters) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Job> query = cb.createQuery(Job.class);
        Root<Job> job = query.from(Job.class);
        
        List<Predicate> predicates = new ArrayList<>();

        if (filters.getQuery() != null && !filters.getQuery().isEmpty()) {
            predicates.add(cb.like(cb.lower(job.get("name")), "%" + filters.getQuery().toLowerCase() + "%"));
        }
        
        if (filters.getLocation() != null && !filters.getLocation().isEmpty()) {
            // Phải join vào bảng Location và so sánh trường "abbreviation"
            Join<Job, Location> locationJoin = job.join("location");
            predicates.add(cb.equal(locationJoin.get("abbreviation"), filters.getLocation()));
        }

        if (filters.getPosition() != null && !filters.getPosition().isEmpty()) {
            // Thêm .as(String.class) để so sánh String với String
            predicates.add(job.get("position").as(String.class).in(filters.getPosition()));
        }

        if (filters.getWorkstyle() != null && !filters.getWorkstyle().isEmpty()) {
            // Thêm .as(String.class) để so sánh String với String
            predicates.add(job.get("workstyle").as(String.class).in(filters.getWorkstyle()));
        } 

        // 5. Lọc theo Lương (Salary Range) - ĐÃ ĐÚNG
        if (filters.getMinSalary() != null) {
            predicates.add(cb.greaterThanOrEqualTo(job.get("maxSalary"), filters.getMinSalary()));
        }
        if (filters.getMaxSalary() != null) {
            predicates.add(cb.lessThanOrEqualTo(job.get("minSalary"), filters.getMaxSalary()));
        }

        // 6. Lọc theo Kỹ năng (skills) - THÊM LOGIC MỚI
        if (filters.getTags() != null && !filters.getTags().isEmpty()) {
            // Tên trường trong Model là "tags"
            // Join vào bảng @ElementCollection
            Join<Job, String> tagJoin = job.join("tags");
            // Tìm các job có tag NÀY hoặc tag KIA (logic OR)
            predicates.add(tagJoin.in(filters.getTags()));
            
            // Thêm distinct để tránh 1 job bị lặp lại nhiều lần
            // (ví dụ: job có cả React và NodeJS)
            query.distinct(true); 
        }

        if (filters.getCompanyID() != null) {
            predicates.add(cb.equal(job.get("companyID"), filters.getCompanyID()));
        }

        // Gộp tất cả điều kiện
        query.where(predicates.toArray(new Predicate[0]));
        
        return entityManager.createQuery(query).getResultList();
    }


}