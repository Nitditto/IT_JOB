package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.dto.request.UpdateCvStatusCommand;
import com.example.demo.enums.CVStatus;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.repository.CVRepository;
import com.example.demo.services.impl.CVServiceImpl;

@ExtendWith(MockitoExtension.class)
class CVOwnershipTest {

    private static final Long OWNER_ID = 10L;
    private static final Long OTHER_COMPANY_ID = 99L;
    private static final Long JOB_ID = 1L;
    private static final Long CANDIDATE_ID = 5L;

    @Mock
    private CVRepository cvRepository;

    @Mock
    private UserService userService;

    @Mock
    private JobService jobService;

    @InjectMocks
    private CVServiceImpl cvService;

    private Job job;

    @BeforeEach
    void setUp() {
        this.job = new Job();
        this.job.setCompanyID(OWNER_ID);
    }

    @Test
    void updateCVStatusByOwnerChangesStatus() {
        final CV cv = new CV();
        cv.setStatus(CVStatus.PENDING);
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));
        when(this.cvRepository.findById(new CVId(CANDIDATE_ID, JOB_ID))).thenReturn(Optional.of(cv));
        when(this.cvRepository.save(any(CV.class))).thenAnswer(invocation -> invocation.getArgument(0));

        final CV result = this.cvService.updateCVStatus(
                new UpdateCvStatusCommand(JOB_ID, CANDIDATE_ID, OWNER_ID, CVStatus.APPROVED));

        assertEquals(CVStatus.APPROVED, result.getStatus());
    }

    @Test
    void updateCVStatusByOtherCompanyIsDenied() {
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));

        assertThrows(AccessDeniedException.class, () -> this.cvService.updateCVStatus(
                new UpdateCvStatusCommand(JOB_ID, CANDIDATE_ID, OTHER_COMPANY_ID, CVStatus.APPROVED)));
        verify(this.cvRepository, never()).save(any(CV.class));
    }

    @Test
    void getCVByJobIDByOtherCompanyIsDenied() {
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));

        assertThrows(AccessDeniedException.class, () -> this.cvService.getCVByJobID(JOB_ID, OTHER_COMPANY_ID));
        verify(this.cvRepository, never()).findByJob(any(Job.class));
    }

    @Test
    void getCVByJobIDByOwnerReturnsCvs() {
        final List<CV> cvs = List.of(new CV());
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));
        when(this.cvRepository.findByJob(this.job)).thenReturn(cvs);

        assertEquals(cvs, this.cvService.getCVByJobID(JOB_ID, OWNER_ID));
    }

    @Test
    void getCVDetailForCompanyByOtherCompanyIsDenied() {
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));

        assertThrows(AccessDeniedException.class,
                () -> this.cvService.getCVDetailForCompany(JOB_ID, CANDIDATE_ID, OTHER_COMPANY_ID));
        verify(this.cvRepository, never()).findById(any(CVId.class));
    }

    @Test
    void getCVByJobIDForMissingJobIsNotFound() {
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> this.cvService.getCVByJobID(JOB_ID, OWNER_ID));
    }

    @Test
    void updateCVStatusRejectsTransitionOutOfFinalStatus() {
        final CV cv = new CV();
        cv.setStatus(CVStatus.REJECTED);
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));
        when(this.cvRepository.findById(new CVId(CANDIDATE_ID, JOB_ID))).thenReturn(Optional.of(cv));

        assertThrows(BusinessException.class, () -> this.cvService.updateCVStatus(
                new UpdateCvStatusCommand(JOB_ID, CANDIDATE_ID, OWNER_ID, CVStatus.APPROVED)));
        verify(this.cvRepository, never()).save(any(CV.class));
    }

    @Test
    void updateCVStatusRejectsCompanyWithdrawing() {
        final CV cv = new CV();
        cv.setStatus(CVStatus.PENDING);
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));
        when(this.cvRepository.findById(new CVId(CANDIDATE_ID, JOB_ID))).thenReturn(Optional.of(cv));

        assertThrows(BusinessException.class, () -> this.cvService.updateCVStatus(
                new UpdateCvStatusCommand(JOB_ID, CANDIDATE_ID, OWNER_ID, CVStatus.WITHDRAWN)));
    }

    @Test
    void updateCVStatusToSameStatusIsNoOp() {
        final CV cv = new CV();
        cv.setStatus(CVStatus.APPROVED);
        when(this.jobService.getJobByID(JOB_ID)).thenReturn(Optional.of(this.job));
        when(this.cvRepository.findById(new CVId(CANDIDATE_ID, JOB_ID))).thenReturn(Optional.of(cv));

        final CV result = this.cvService.updateCVStatus(
                new UpdateCvStatusCommand(JOB_ID, CANDIDATE_ID, OWNER_ID, CVStatus.APPROVED));

        assertEquals(CVStatus.APPROVED, result.getStatus());
        verify(this.cvRepository, never()).save(any(CV.class));
    }
}
