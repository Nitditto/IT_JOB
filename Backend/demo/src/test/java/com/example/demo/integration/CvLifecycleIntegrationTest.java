package com.example.demo.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.demo.dto.request.CVCreationRequest;
import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.dto.request.UpdateCvStatusCommand;
import com.example.demo.enums.CVStatus;
import com.example.demo.enums.JobStatus;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.BusinessException;
import com.example.demo.model.Account;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.repository.CVRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.services.CVService;
import com.example.demo.services.SavedJobService;
import com.example.demo.services.UserService;

class CvLifecycleIntegrationTest extends BasePostgresIntegrationTest {

    @Autowired
    private CVService cvService;

    @Autowired
    private CVRepository cvRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private SavedJobService savedJobService;

    private Account newAccount(final UserRole role) {
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("user");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        return this.userService.register(request, role);
    }

    private Job newJob(final Account company, final JobStatus status, final Instant deadline) {
        return this.jobRepository.save(Job.builder()
                .companyID(company.getId())
                .name("Backend Developer")
                .status(status)
                .deadline(deadline)
                .build());
    }

    private CVCreationRequest application() {
        return new CVCreationRequest("A", "0123456789", "a@b.com", "cv.pdf", null, null, null, null, null);
    }

    private int appliedCount(final Job job) {
        return this.jobRepository.findById(job.getId()).orElseThrow().getAppliedCount();
    }

    @Test
    void concurrentApplicationsAreAllCounted() throws Exception {
        final Job job = this.newJob(this.newAccount(UserRole.ROLE_COMPANY), JobStatus.published, null);
        final int applicants = 8;
        final List<Account> candidates = new ArrayList<>();
        for (int i = 0; i < applicants; i++) {
            candidates.add(this.newAccount(UserRole.ROLE_USER));
        }
        final ExecutorService executor = Executors.newFixedThreadPool(applicants);
        final CountDownLatch start = new CountDownLatch(1);
        final List<Future<?>> futures = new ArrayList<>();
        for (final Account candidate : candidates) {
            futures.add(executor.submit(() -> {
                start.await();
                return this.cvService.addCV(this.application(), candidate.getId(), job.getId());
            }));
        }
        start.countDown();
        for (final Future<?> future : futures) {
            future.get();
        }
        executor.shutdown();

        assertThat(this.appliedCount(job)).isEqualTo(applicants);
    }

    @Test
    void duplicateApplicationIsRejected() {
        final Job job = this.newJob(this.newAccount(UserRole.ROLE_COMPANY), JobStatus.published, null);
        final Account candidate = this.newAccount(UserRole.ROLE_USER);
        this.cvService.addCV(this.application(), candidate.getId(), job.getId());

        assertThrows(BusinessException.class, () -> this.cvService.addCV(this.application(), candidate.getId(), job.getId()));
        assertThat(this.appliedCount(job)).isEqualTo(1);
    }

    @Test
    void closedOrExpiredJobsRejectApplications() {
        final Account company = this.newAccount(UserRole.ROLE_COMPANY);
        final Account candidate = this.newAccount(UserRole.ROLE_USER);
        final Job draft = this.newJob(company, JobStatus.draft, null);
        final Job expired = this.newJob(company, JobStatus.published, Instant.now().minusSeconds(60));

        assertThrows(BusinessException.class, () -> this.cvService.addCV(this.application(), candidate.getId(), draft.getId()));
        assertThrows(BusinessException.class, () -> this.cvService.addCV(this.application(), candidate.getId(), expired.getId()));
    }

    @Test
    void withdrawingPendingCvDeletesItAndAllowsReapply() {
        final Job job = this.newJob(this.newAccount(UserRole.ROLE_COMPANY), JobStatus.published, null);
        final Account candidate = this.newAccount(UserRole.ROLE_USER);
        this.cvService.addCV(this.application(), candidate.getId(), job.getId());

        this.cvService.deleteCV(job.getId(), candidate.getId());

        assertThat(this.cvRepository.existsById(new CVId(candidate.getId(), job.getId()))).isFalse();
        assertThat(this.appliedCount(job)).isZero();
        this.cvService.addCV(this.application(), candidate.getId(), job.getId());
        assertThat(this.appliedCount(job)).isEqualTo(1);
    }

    @Test
    void withdrawingApprovedCvKeepsRecordAsWithdrawnAndAllowsReapply() {
        final Account company = this.newAccount(UserRole.ROLE_COMPANY);
        final Job job = this.newJob(company, JobStatus.published, null);
        final Account candidate = this.newAccount(UserRole.ROLE_USER);
        this.cvService.addCV(this.application(), candidate.getId(), job.getId());
        this.cvService.updateCVStatus(new UpdateCvStatusCommand(job.getId(), candidate.getId(), company.getId(), CVStatus.APPROVED));

        this.cvService.deleteCV(job.getId(), candidate.getId());

        final CVId id = new CVId(candidate.getId(), job.getId());
        assertThat(this.cvRepository.findById(id).orElseThrow().getStatus()).isEqualTo(CVStatus.WITHDRAWN);
        assertThat(this.savedJobService.getUserJobState(job.getId(), candidate).getApplied()).isFalse();
        assertThat(this.appliedCount(job)).isZero();

        this.cvService.addCV(this.application(), candidate.getId(), job.getId());
        assertThat(this.cvRepository.findById(id).orElseThrow().getStatus()).isEqualTo(CVStatus.PENDING);
        assertThat(this.appliedCount(job)).isEqualTo(1);
    }

    @Test
    void rejectedCvCannotBeWithdrawn() {
        final Account company = this.newAccount(UserRole.ROLE_COMPANY);
        final Job job = this.newJob(company, JobStatus.published, null);
        final Account candidate = this.newAccount(UserRole.ROLE_USER);
        this.cvService.addCV(this.application(), candidate.getId(), job.getId());
        this.cvService.updateCVStatus(new UpdateCvStatusCommand(job.getId(), candidate.getId(), company.getId(), CVStatus.REJECTED));

        assertThrows(BusinessException.class, () -> this.cvService.deleteCV(job.getId(), candidate.getId()));
    }
}
