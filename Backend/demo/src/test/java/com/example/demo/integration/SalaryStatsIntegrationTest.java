package com.example.demo.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;
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
class SalaryStatsIntegrationTest extends BasePostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private UserService userService;

    private Long companyId;

    @BeforeEach
    void setUp() {
        this.jobRepository.deleteAll();
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("company");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        this.companyId = this.userService.register(request, UserRole.ROLE_COMPANY).getId();
    }

    private void saveJob(final long minSalary, final long maxSalary, final JobStatus status) {
        this.jobRepository.save(Job.builder()
                .companyID(this.companyId)
                .name("Dev")
                .status(status)
                .salaryCurrency("USD")
                .minSalary(minSalary)
                .maxSalary(maxSalary)
                .tags(Set.of("java"))
                .location(this.locationRepository.findById("HN").orElseThrow())
                .build());
    }

    @Test
    void aggregatesOnlyPublishedJobsWithSalaryPerTag() throws Exception {
        this.saveJob(1000, 2000, JobStatus.published);
        this.saveJob(2000, 4000, JobStatus.published);
        this.saveJob(9000, 9999, JobStatus.draft);

        this.mockMvc.perform(get("/jobs/stats/salary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].tag").value("java"))
                .andExpect(jsonPath("$.data[0].currency").value("USD"))
                .andExpect(jsonPath("$.data[0].jobCount").value(2))
                .andExpect(jsonPath("$.data[0].minSalary").value(1000))
                .andExpect(jsonPath("$.data[0].maxSalary").value(4000))
                .andExpect(jsonPath("$.data[0].avgSalary").value(2250.0));
    }
}
