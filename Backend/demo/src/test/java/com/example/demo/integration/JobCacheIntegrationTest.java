package com.example.demo.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.enums.JobStatus;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Job;
import com.example.demo.redis.repository.JobRedisRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.LocationRepository;
import com.example.demo.services.JobService;
import com.example.demo.services.UserService;

/** Chạy với Redis thật: xác nhận read-through, làm mới cache khi sửa, xoá khi delete. */
class JobCacheIntegrationTest extends BasePostgresIntegrationTest {

    @Autowired
    private JobService jobService;

    @Autowired
    private JobRedisRepository jobRedisRepository;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private UserService userService;

    private Long companyId;
    private Long jobId;

    @BeforeEach
    void setUp() {
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("company");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        this.companyId = this.userService.register(request, UserRole.ROLE_COMPANY).getId();
        this.jobId = this.jobRepository.save(Job.builder()
                .companyID(this.companyId)
                .name("Cached job")
                .status(JobStatus.published)
                .location(this.locationRepository.findById("HN").orElseThrow())
                .build()).getId();
        this.jobRedisRepository.deleteById(this.jobId);
    }

    private boolean isCached() {
        return Boolean.TRUE.equals(this.stringRedisTemplate.hasKey("job:" + this.jobId));
    }

    @Test
    void cacheMissLoadsFromDbAndPopulatesRedis() {
        assertThat(this.isCached()).isFalse();

        assertThat(this.jobService.getCachedJobResponse(this.jobId).getName()).isEqualTo("Cached job");

        assertThat(this.isCached()).isTrue();
    }

    @Test
    void editRefreshesCachedValue() {
        this.jobService.getCachedJobResponse(this.jobId);
        final JobEditRequest edit = mock(JobEditRequest.class);
        when(edit.getJobID()).thenReturn(this.jobId);
        when(edit.getName()).thenReturn("Renamed job");
        when(edit.getLocation()).thenReturn("HN");
        when(edit.getStatus()).thenReturn(JobStatus.published);

        this.jobService.editJob(edit, this.companyId);

        assertThat(this.jobService.getCachedJobResponse(this.jobId).getName()).isEqualTo("Renamed job");
    }

    @Test
    void deleteEvictsCacheAndRow() {
        this.jobService.getCachedJobResponse(this.jobId);

        this.jobService.deleteJob(this.jobId, this.companyId);

        assertThat(this.isCached()).isFalse();
        assertThatThrownBy(() -> this.jobService.getCachedJobResponse(this.jobId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
