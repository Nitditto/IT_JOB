package com.example.demo.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.config.SecurityConfig;
import com.example.demo.config.filter.JwtAuthenticationFilter;
import com.example.demo.config.filter.RateLimitingFilter;
import com.example.demo.dto.request.JobEditRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.model.Account;
import com.example.demo.services.JobService;
import com.example.demo.services.JobViewService;
import com.example.demo.services.RecommendationService;
import com.example.demo.services.UserService;

@WebMvcTest(controllers = JobController.class, excludeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE,
        classes = { SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitingFilter.class }))
@Import(ControllerSecurityTestConfig.class)
class JobControllerEditSecurityTest {

    private static final String EDIT_BODY = "{\"name\":\"Backend Dev\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobService jobService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private RecommendationService recommendationService;

    @MockitoBean
    private JobViewService jobViewService;

    private static Authentication authAs(final Long id, final UserRole role) {
        final Account account = new Account();
        account.setId(id);
        account.setEmail("u" + id + "@test.com");
        account.setRole(role);
        return new UsernamePasswordAuthenticationToken(account, null, account.getAuthorities());
    }

    @Test
    void editJobPassesActorCompanyIdToService() throws Exception {
        this.mockMvc.perform(put("/jobs/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EDIT_BODY)
                        .with(authentication(authAs(10L, UserRole.ROLE_COMPANY))))
                .andExpect(status().isOk());

        verify(this.jobService).editJob(any(JobEditRequest.class), eq(10L));
    }

    @Test
    void editJobByNonOwnerReturns403() throws Exception {
        when(this.jobService.editJob(any(JobEditRequest.class), eq(99L)))
                .thenThrow(new AccessDeniedException("Bạn không có quyền sửa công việc này!"));

        this.mockMvc.perform(put("/jobs/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EDIT_BODY)
                        .with(authentication(authAs(99L, UserRole.ROLE_COMPANY))))
                .andExpect(status().isForbidden());
    }

    @Test
    void candidateCannotEditJob() throws Exception {
        this.mockMvc.perform(put("/jobs/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EDIT_BODY)
                        .with(authentication(authAs(5L, UserRole.ROLE_USER))))
                .andExpect(status().isForbidden());
        verify(this.jobService, never()).editJob(any(JobEditRequest.class), any(Long.class));
    }
}
