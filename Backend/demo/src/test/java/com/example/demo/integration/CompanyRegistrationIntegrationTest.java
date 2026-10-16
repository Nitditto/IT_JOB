package com.example.demo.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.enums.UserRole;
import com.example.demo.repository.AccountRepository;

@AutoConfigureMockMvc
class CompanyRegistrationIntegrationTest extends BasePostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    void anonymousVisitorCanRegisterCompanyAccount() throws Exception {
        final String email = UUID.randomUUID() + "@company.test";
        final String body = "{\"name\":\"Acme\",\"email\":\"" + email + "\",\"password\":\"Passw0rd!\"}";

        this.mockMvc.perform(post("/auth/register/company")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        assertThat(this.accountRepository.findByEmail(email))
                .hasValueSatisfying(account -> assertThat(account.getRole()).isEqualTo(UserRole.ROLE_COMPANY));
    }
}
