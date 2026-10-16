package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.services.UserService;

@AutoConfigureMockMvc
class AiEndpointIntegrationTest extends BasePostgresIntegrationTest {

    private static final String VALID_BODY = "{\"prompt\":\"hello\"}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private UserDetailsService userDetailsService;

    private UserDetails registeredCandidate() {
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("candidate");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        this.userService.register(request, UserRole.ROLE_USER);
        return this.userDetailsService.loadUserByUsername(request.getEmail());
    }

    @Test
    void anonymousCallerIsRejected() throws Exception {
        this.mockMvc.perform(post("/ai/generate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void returns503WhenGeminiKeyIsNotConfigured() throws Exception {
        this.mockMvc.perform(post("/ai/generate")
                        .with(user(this.registeredCandidate()))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void rejectsBlankPrompt() throws Exception {
        this.mockMvc.perform(post("/ai/generate")
                        .with(user(this.registeredCandidate()))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"\"}"))
                .andExpect(status().isBadRequest());
    }
}
