package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.dto.response.JobResponse;
import com.example.demo.enums.JobStatus;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.redis.entity.JobRedis;
import com.example.demo.redis.repository.JobRedisRepository;
import com.example.demo.services.impl.JobServiceImpl;

@ExtendWith(MockitoExtension.class)
class JobVisibilityTest {

    private static final long JOB_ID = 1L;
    private static final long OWNER_ID = 10L;

    @Mock
    private JobRedisRepository jobRedisRepository;

    @InjectMocks
    private JobServiceImpl jobService;

    private void givenJob(final JobStatus status) {
        final JobRedis job = JobRedis.builder().id(JOB_ID).companyID(OWNER_ID).status(status).build();
        when(this.jobRedisRepository.findById(JOB_ID)).thenReturn(Optional.of(job));
    }

    private Account account(final long id, final UserRole role) {
        final Account account = new Account();
        account.setId(id);
        account.setRole(role);
        return account;
    }

    @Test
    void anonymousCanViewPublishedJob() {
        this.givenJob(JobStatus.published);

        final JobResponse response = this.jobService.getVisibleJobResponse(JOB_ID, null);

        assertEquals(JOB_ID, response.getId());
    }

    @Test
    void anonymousCannotViewDraftJob() {
        this.givenJob(JobStatus.draft);

        assertThrows(ResourceNotFoundException.class, () -> this.jobService.getVisibleJobResponse(JOB_ID, null));
    }

    @Test
    void otherCompanyCannotViewDraftJob() {
        this.givenJob(JobStatus.draft);
        final Account other = this.account(99L, UserRole.ROLE_COMPANY);

        assertThrows(ResourceNotFoundException.class, () -> this.jobService.getVisibleJobResponse(JOB_ID, other));
    }

    @Test
    void ownerAndAdminCanViewDraftJob() {
        this.givenJob(JobStatus.draft);

        final JobResponse asOwner = this.jobService.getVisibleJobResponse(JOB_ID, this.account(OWNER_ID, UserRole.ROLE_COMPANY));
        final JobResponse asAdmin = this.jobService.getVisibleJobResponse(JOB_ID, this.account(1L, UserRole.ROLE_ADMIN));

        assertEquals(JOB_ID, asOwner.getId());
        assertEquals(JOB_ID, asAdmin.getId());
    }
}
