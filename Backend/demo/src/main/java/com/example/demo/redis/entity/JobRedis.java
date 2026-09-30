package com.example.demo.redis.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.example.demo.constants.SyncStrategy;
import com.example.demo.enums.JobEmploymentType;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobStatus;
import com.example.demo.enums.JobWorkstyle;
import com.example.demo.model.Job;
import com.example.demo.model.Location;
import com.example.demo.redis.core.annotation.LinkedJpaEntity;
import com.example.demo.redis.core.annotation.RedisEntity;
import com.example.demo.redis.core.annotation.RedisId;
import com.example.demo.redis.core.annotation.RedisIndexed;
import com.example.demo.redis.core.entity.BaseRedisEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Cache read-through cho {@code Job} — chỉ đọc, không ghi ngược DB.
 *
 * <p>{@code Job.id} sinh bởi DB sequence (không client-generatable như UUID), nên khác các
 * entity mẫu bên wiki-service (PK là UUID, sinh trước khi ghi DB, phù hợp WRITE_BEHIND):
 * ở đây bắt buộc dùng {@code SyncStrategy.CACHE_ONLY} + {@code autoSync = false} — DB
 * ({@code JobRepository} qua {@code JobServiceImpl}) vẫn là nơi ghi duy nhất, entity này chỉ
 * được tạo TỪ 1 {@code Job} đã lưu DB (xem {@link #fromJpaEntity}) rồi cache lại. Lý do khác:
 * {@code Job.tags}/{@code Job.images} là {@code @ElementCollection} (bảng con riêng), UPSERT
 * generic 1-bảng của {@code DbSyncService} không xử lý đúng trường hợp này.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@RedisEntity(value = "job", timeToLive = 900, autoSync = false, syncStrategy = SyncStrategy.CACHE_ONLY)
@LinkedJpaEntity(Job.class)
public class JobRedis extends BaseRedisEntity<Long> {

    @RedisId
    private Long id;

    @RedisIndexed
    private Long companyID;

    private String name;
    private String category;
    private String industry;
    private String salaryCurrency;
    private Boolean salaryNegotiable;
    private Long minSalary;
    private Long maxSalary;
    private Integer minExperienceYears;
    private Integer maxExperienceYears;
    private Integer vacancies;
    private Instant deadline;
    private Boolean urgent;
    private Boolean featured;
    private JobPosition position;
    private JobWorkstyle workstyle;
    private JobEmploymentType employmentType;
    private JobStatus status;
    private Location location;
    private String address;
    private List<String> tags;
    private List<String> images;
    private String description;
    private String requirements;
    private String benefits;
    private String workingTime;
    private Integer appliedCount;
    private Instant createdAt;

    // getId()/setId(Long) sinh bởi @Data cho field `id` phía trên — khớp đúng signature abstract
    // method của BaseRedisEntity<Long>, không cần override tay.

    public static JobRedis fromJpaEntity(Job job) {
        JobRedis redis = JobRedis.builder()
                .id(job.getId())
                .companyID(job.getCompanyID())
                .name(job.getName())
                .category(job.getCategory())
                .industry(job.getIndustry())
                .salaryCurrency(job.getSalaryCurrency())
                .salaryNegotiable(job.getSalaryNegotiable())
                .minSalary(job.getMinSalary())
                .maxSalary(job.getMaxSalary())
                .minExperienceYears(job.getMinExperienceYears())
                .maxExperienceYears(job.getMaxExperienceYears())
                .vacancies(job.getVacancies())
                .deadline(job.getDeadline())
                .urgent(job.getUrgent())
                .featured(job.getFeatured())
                .position(job.getPosition())
                .workstyle(job.getWorkstyle())
                .employmentType(job.getEmploymentType())
                .status(job.getStatus())
                .location(job.getLocation())
                .address(job.getAddress())
                .tags(job.getTags() != null ? new ArrayList<>(job.getTags()) : new ArrayList<>())
                .images(job.getImages() != null ? new ArrayList<>(job.getImages()) : new ArrayList<>())
                .description(job.getDescription())
                .requirements(job.getRequirements())
                .benefits(job.getBenefits())
                .workingTime(job.getWorkingTime())
                .appliedCount(job.getAppliedCount())
                .createdAt(job.getCreatedAt())
                .build();
        redis.setSynced(true); // đọc thẳng từ DB nên coi như đã "đồng bộ" ngay từ đầu
        return redis;
    }
}
