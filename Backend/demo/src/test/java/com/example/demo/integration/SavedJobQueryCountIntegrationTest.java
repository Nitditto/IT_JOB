package com.example.demo.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.LocationRepository;
import com.example.demo.services.SavedJobService;
import com.example.demo.services.UserService;

import jakarta.persistence.EntityManagerFactory;

@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class SavedJobQueryCountIntegrationTest extends BasePostgresIntegrationTest {

    private static final int SAVED_JOBS = 12;
    private static final int MAX_STATEMENTS = 6;

    @Autowired
    private SavedJobService savedJobService;

    @Autowired
    private UserService userService;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private Account register(final UserRole role) {
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("user");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        return this.userService.register(request, role);
    }

    @Test
    void listingSavedJobsUsesConstantNumberOfStatements() {
        final Account candidate = this.register(UserRole.ROLE_USER);
        for (int i = 0; i < SAVED_JOBS; i++) {
            final Account company = this.register(UserRole.ROLE_COMPANY);
            final Job job = this.jobRepository.save(Job.builder()
                    .companyID(company.getId())
                    .name("Job " + i)
                    .location(this.locationRepository.findById("HN").orElseThrow())
                    .tags(Set.of("java", "spring"))
                    .build());
            this.savedJobService.saveJob(job.getId(), candidate);
        }
        final Statistics statistics = this.entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        assertThat(this.savedJobService.getSavedJobs(candidate)).hasSize(SAVED_JOBS);

        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(MAX_STATEMENTS);
    }
}
