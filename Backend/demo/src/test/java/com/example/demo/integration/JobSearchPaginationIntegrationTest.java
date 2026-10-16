package com.example.demo.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.enums.JobStatus;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Job;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.LocationRepository;
import com.example.demo.services.UserService;

@AutoConfigureMockMvc
class JobSearchPaginationIntegrationTest extends BasePostgresIntegrationTest {

    private static final int JOB_COUNT = 5;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private LocationRepository locationRepository;

    @BeforeEach
    void setUp() {
        this.jobRepository.deleteAll();
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("company");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        final Long companyId = this.userService.register(request, UserRole.ROLE_COMPANY).getId();
        for (int index = 0; index < JOB_COUNT; index++) {
            this.jobRepository.save(Job.builder()
                    .companyID(companyId)
                    .name("Paged job " + index)
                    .status(JobStatus.published)
                    .location(this.locationRepository.findById("HN").orElseThrow())
                    .build());
        }
    }

    @Test
    void withoutPageParamReturnsEverythingWithoutHeaders() throws Exception {
        this.mockMvc.perform(get("/jobs"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("X-Total-Count"))
                .andExpect(jsonPath("$.data.length()").value(JOB_COUNT));
    }

    @Test
    void pageParamsSliceResultAndExposeTotals() throws Exception {
        this.mockMvc.perform(get("/jobs").param("page", "1").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Total-Count", String.valueOf(JOB_COUNT)))
                .andExpect(header().string("X-Total-Pages", "3"))
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void lastPageContainsRemainder() throws Exception {
        this.mockMvc.perform(get("/jobs").param("page", "2").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }
}
