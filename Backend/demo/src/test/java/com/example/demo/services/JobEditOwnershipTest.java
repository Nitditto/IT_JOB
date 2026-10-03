package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.model.Job;
import com.example.demo.repository.JobRepository;
import com.example.demo.services.impl.JobServiceImpl;

@ExtendWith(MockitoExtension.class)
class JobEditOwnershipTest {

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private JobServiceImpl jobService;

    @Test
    void editJobByOtherCompanyIsDenied() {
        final Job job = new Job();
        job.setCompanyID(10L);
        final JobEditRequest request = mock(JobEditRequest.class);
        when(request.getJobID()).thenReturn(1L);
        when(this.jobRepository.findById(1L)).thenReturn(Optional.of(job));

        assertThrows(AccessDeniedException.class, () -> this.jobService.editJob(request, 99L));
        verify(this.jobRepository, never()).save(any(Job.class));
    }
}
