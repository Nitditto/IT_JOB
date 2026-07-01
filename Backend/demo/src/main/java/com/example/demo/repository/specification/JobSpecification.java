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
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + filters.getQuery().toLowerCase() + "%"));
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

            // Lọc theo khoảng lương
            if (filters.getMinSalary() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("maxSalary"), filters.getMinSalary()));
            }
            if (filters.getMaxSalary() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("minSalary"), filters.getMaxSalary()));
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
