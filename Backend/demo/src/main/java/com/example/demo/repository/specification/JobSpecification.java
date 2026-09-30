package com.example.demo.repository.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.example.demo.dto.request.JobFilterRequest;
import com.example.demo.model.Job;
import com.example.demo.model.Location;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

public class JobSpecification {

    public static Specification<Job> withFilters(JobFilterRequest filters) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Chỉ fetch Location khi không phải câu lệnh count (ví dụ phân trang hoặc đếm)
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("location", JoinType.LEFT);
            }

            // Lọc theo từ khóa (tên công việc)
            if (filters.getQuery() != null && !filters.getQuery().trim().isEmpty()) {
                String keyword = "%" + filters.getQuery().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), keyword),
                        cb.like(cb.lower(root.get("industry")), keyword),
                        cb.like(cb.lower(root.get("category")), keyword)));
            }
            
            // Lọc theo địa điểm (viết tắt)
            if (filters.getLocation() != null && !filters.getLocation().trim().isEmpty()) {
                Join<Job, Location> locationJoin = root.join("location");
                predicates.add(cb.equal(locationJoin.get("abbreviation"), filters.getLocation()));
            }

            // Lọc theo vị trí tuyển dụng
            if (filters.getPosition() != null && !filters.getPosition().isEmpty()) {
                predicates.add(root.get("position").as(String.class).in(filters.getPosition()));
            }

            // Lọc theo hình thức làm việc (workstyle)
            if (filters.getWorkstyle() != null && !filters.getWorkstyle().isEmpty()) {
                predicates.add(root.get("workstyle").as(String.class).in(filters.getWorkstyle()));
            } 

            if (filters.getEmploymentType() != null && !filters.getEmploymentType().isEmpty()) {
                predicates.add(root.get("employmentType").as(String.class).in(filters.getEmploymentType()));
            }

            if (filters.getStatus() != null && !filters.getStatus().isEmpty()) {
                predicates.add(root.get("status").as(String.class).in(filters.getStatus()));
            }

            // Lọc theo khoảng lương
            if (filters.getMinSalary() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("maxSalary"), filters.getMinSalary()));
            }
            if (filters.getMaxSalary() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("minSalary"), filters.getMaxSalary()));
            }

            if (filters.getMinExperienceYears() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("maxExperienceYears"), filters.getMinExperienceYears()));
            }
            if (filters.getMaxExperienceYears() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("minExperienceYears"), filters.getMaxExperienceYears()));
            }

            // Lọc theo tags/kỹ năng (OR logic)
            if (filters.getTags() != null && !filters.getTags().isEmpty()) {
                Join<Job, String> tagJoin = root.join("tags");
                predicates.add(tagJoin.in(filters.getTags()));
                query.distinct(true); 
            }

            // Lọc theo công ty
            if (filters.getCompanyID() != null) {
                predicates.add(cb.equal(root.get("companyID"), filters.getCompanyID()));
            }

            if (filters.getCategory() != null && !filters.getCategory().trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), filters.getCategory().toLowerCase()));
            }

            if (filters.getIndustry() != null && !filters.getIndustry().trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("industry")), filters.getIndustry().toLowerCase()));
            }

            if (filters.getSalaryNegotiable() != null) {
                predicates.add(cb.equal(root.get("salaryNegotiable"), filters.getSalaryNegotiable()));
            }

            if (filters.getUrgent() != null) {
                predicates.add(cb.equal(root.get("urgent"), filters.getUrgent()));
            }

            if (filters.getFeatured() != null) {
                predicates.add(cb.equal(root.get("featured"), filters.getFeatured()));
            }

            if (filters.getDeadlineFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("deadline"), filters.getDeadlineFrom()));
            }
            if (filters.getDeadlineTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("deadline"), filters.getDeadlineTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
