package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.repository.AccountRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.LocationRepository;
import com.example.demo.services.UserService;

/**
 * Gọi qua tầng HTTP với principal nạp ngoài session (giống JwtAuthenticationFilter) để phát hiện
 * LazyInitializationException khi tắt open-in-view.
 */
@AutoConfigureMockMvc
class EndpointSmokeIntegrationTest extends BasePostgresIntegrationTest {

    private static final String APPLY_BODY =
            "{\"name\":\"A\",\"phone\":\"0123456789\",\"email\":\"a@b.com\",\"cvFile\":\"cv.pdf\"}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private LocationRepository locationRepository;

    private UserDetails candidate;
    private UserDetails company;
    private Long jobId;

    private Account register(final UserRole role) {
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("user");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        final Account account = this.userService.register(request, role);
        account.setLocation(this.locationRepository.findById("HN").orElseThrow());
        return this.accountRepository.save(account);
    }

    @BeforeEach
    void setUp() {
        final Account companyAccount = this.register(UserRole.ROLE_COMPANY);
        final Account candidateAccount = this.register(UserRole.ROLE_USER);
        this.company = this.userDetailsService.loadUserByUsername(companyAccount.getEmail());
        this.candidate = this.userDetailsService.loadUserByUsername(candidateAccount.getEmail());
        final Job job = this.jobRepository.save(Job.builder()
                .companyID(companyAccount.getId())
                .name("Backend Developer")
                .location(this.locationRepository.findById("HN").orElseThrow())
                .tags(Set.of("java", "spring"))
                .build());
        this.jobId = job.getId();
    }

    @Test
    void publicReadEndpointsWork() throws Exception {
        this.mockMvc.perform(get("/jobs")).andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs/" + this.jobId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.location.abbreviation").value("HN"));
        this.mockMvc.perform(get("/jobs/tags")).andExpect(status().isOk());
        this.mockMvc.perform(get("/companies")).andExpect(status().isOk());
        this.mockMvc.perform(get("/locations")).andExpect(status().isOk());
    }

    @Test
    void candidateFlowsWork() throws Exception {
        this.mockMvc.perform(post("/jobs/" + this.jobId + "/cvs").with(user(this.candidate)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(APPLY_BODY)).andExpect(status().isCreated());
        this.mockMvc.perform(get("/cvs").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs/" + this.jobId + "/cvs/me").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(post("/jobs/" + this.jobId + "/save").with(user(this.candidate)).with(csrf())).andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs/saved").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs/" + this.jobId + "/state").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs/recommendations").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/job-alerts").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/companies/following").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/auth/me").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(delete("/jobs/" + this.jobId + "/cvs").with(user(this.candidate)).with(csrf())).andExpect(status().isOk());
    }

    @Test
    void companyFlowsWork() throws Exception {
        this.mockMvc.perform(post("/jobs/" + this.jobId + "/cvs").with(user(this.candidate)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(APPLY_BODY)).andExpect(status().isCreated());
        final Long candidateId = ((Account) this.candidate).getId();

        this.mockMvc.perform(get("/jobs/" + this.jobId + "/cvs").with(user(this.company))).andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs/" + this.jobId + "/cvs/accounts/" + candidateId).with(user(this.company)))
                .andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs/" + this.jobId + "/stats").with(user(this.company))).andExpect(status().isOk());
        this.mockMvc.perform(get("/jobs?companyID=" + ((Account) this.company).getId()).with(user(this.company)))
                .andExpect(status().isOk());
    }

    @Test
    void writeFlowsWork() throws Exception {
        final String createBody = "{\"name\":\"Java Dev\",\"minSalary\":1000,\"maxSalary\":2000,\"position\":\"junior\","
                + "\"workstyle\":\"remote\",\"location\":\"HN\",\"tags\":[\"java\"],\"images\":[\"a.png\"]}";
        this.mockMvc.perform(post("/jobs").with(user(this.company)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(createBody)).andExpect(status().isCreated());
        final String editBody = "{\"name\":\"Backend Developer\",\"minSalary\":1000,\"maxSalary\":3000,\"status\":\"published\","
                + "\"location\":\"HN\",\"tags\":[\"java\"],\"images\":[\"a.png\"]}";
        this.mockMvc.perform(put("/jobs/" + this.jobId).with(user(this.company)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(editBody)).andExpect(status().isOk());
        this.mockMvc.perform(put("/users/me").with(user(this.candidate)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"New Name\",\"email\":\"" + ((Account) this.candidate).getEmail() + "\",\"location\":\"SG\"}"))
                .andExpect(status().isOk());
        this.mockMvc.perform(put("/companies/me").with(user(this.company)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"ACME\",\"email\":\"" + ((Account) this.company).getEmail() + "\",\"location\":\"SG\"}"))
                .andExpect(status().isOk());
        this.mockMvc.perform(get("/users/" + ((Account) this.candidate).getId()).with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/companies/" + ((Account) this.company).getId())).andExpect(status().isOk());
    }

    @Test
    void followAndAlertFlowsWork() throws Exception {
        final Long companyId = ((Account) this.company).getId();
        this.mockMvc.perform(post("/companies/" + companyId + "/follow").with(user(this.candidate)).with(csrf()))
                .andExpect(status().isOk());
        this.mockMvc.perform(get("/companies/following").with(user(this.candidate))).andExpect(status().isOk());
        this.mockMvc.perform(get("/companies/" + companyId + "/followers/count").with(user(this.candidate)))
                .andExpect(status().isOk());
        this.mockMvc.perform(post("/job-alerts").with(user(this.candidate)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Java alert\",\"tags\":[\"java\"]}")).andExpect(status().isCreated());
        this.mockMvc.perform(get("/job-alerts").with(user(this.candidate))).andExpect(status().isOk());
    }
}
