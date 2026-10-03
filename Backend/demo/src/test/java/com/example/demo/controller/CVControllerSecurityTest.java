package com.example.demo.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
import com.example.demo.dto.request.CVEditRequest;
import com.example.demo.dto.request.UpdateCvStatusCommand;
import com.example.demo.enums.CVStatus;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.services.CVService;

@WebMvcTest(controllers = CVController.class, excludeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE,
        classes = { SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitingFilter.class }))
@Import(ControllerSecurityTestConfig.class)
class CVControllerSecurityTest {

    private static final Long COMPANY_ID = 10L;
    private static final Long CANDIDATE_ID = 5L;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CVService cvService;

    private static Authentication authAs(final Long id, final UserRole role) {
        final Account account = new Account();
        account.setId(id);
        account.setEmail("u" + id + "@test.com");
        account.setRole(role);
        return new UsernamePasswordAuthenticationToken(account, null, account.getAuthorities());
    }

    @Test
    void updateStatusPassesActorCompanyIdToService() throws Exception {
        this.mockMvc.perform(patch("/jobs/1/cvs/accounts/5/status")
                        .param("status", "APPROVED")
                        .with(authentication(authAs(COMPANY_ID, UserRole.ROLE_COMPANY))))
                .andExpect(status().isOk());

        final ArgumentCaptor<UpdateCvStatusCommand> captor = ArgumentCaptor.forClass(UpdateCvStatusCommand.class);
        verify(this.cvService).updateCVStatus(captor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(
                new UpdateCvStatusCommand(1L, CANDIDATE_ID, COMPANY_ID, CVStatus.APPROVED), captor.getValue());
    }

    @Test
    void updateStatusByNonOwnerReturns403() throws Exception {
        when(this.cvService.updateCVStatus(any(UpdateCvStatusCommand.class)))
                .thenThrow(new AccessDeniedException("Bạn không có quyền truy cập CV của công việc này!"));

        this.mockMvc.perform(patch("/jobs/1/cvs/accounts/5/status")
                        .param("status", "APPROVED")
                        .with(authentication(authAs(99L, UserRole.ROLE_COMPANY))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void candidateCannotCallCompanyStatusEndpoint() throws Exception {
        this.mockMvc.perform(patch("/jobs/1/cvs/accounts/5/status")
                        .param("status", "APPROVED")
                        .with(authentication(authAs(CANDIDATE_ID, UserRole.ROLE_USER))))
                .andExpect(status().isForbidden());
        verify(this.cvService, never()).updateCVStatus(any(UpdateCvStatusCommand.class));
    }

    @Test
    void listJobCvsByNonOwnerReturns403() throws Exception {
        when(this.cvService.getCVByJobID(eq(1L), eq(99L)))
                .thenThrow(new AccessDeniedException("Bạn không có quyền truy cập CV của công việc này!"));

        this.mockMvc.perform(get("/jobs/1/cvs")
                        .with(authentication(authAs(99L, UserRole.ROLE_COMPANY))))
                .andExpect(status().isForbidden());
    }

    @Test
    void listJobCvsByOwnerReturns200() throws Exception {
        when(this.cvService.getCVByJobID(1L, COMPANY_ID)).thenReturn(List.of());
        when(this.cvService.toDTOList(List.of())).thenReturn(List.of());

        this.mockMvc.perform(get("/jobs/1/cvs")
                        .with(authentication(authAs(COMPANY_ID, UserRole.ROLE_COMPANY))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void cvDetailByNonOwnerReturns403() throws Exception {
        when(this.cvService.getCVDetailForCompany(1L, CANDIDATE_ID, 99L))
                .thenThrow(new AccessDeniedException("Bạn không có quyền truy cập CV của công việc này!"));

        this.mockMvc.perform(get("/jobs/1/cvs/accounts/5")
                        .with(authentication(authAs(99L, UserRole.ROLE_COMPANY))))
                .andExpect(status().isForbidden());
        verify(this.cvService, never()).toDTO(any(CV.class));
    }

    @Test
    void editCvIgnoresStatusInPayload() throws Exception {
        when(this.cvService.editCV(any(CVEditRequest.class), eq(CANDIDATE_ID), eq(1L))).thenReturn(new CV());
        final String body = "{\"name\":\"A\",\"phone\":\"0123\",\"email\":\"a@b.com\",\"status\":\"APPROVED\"}";

        this.mockMvc.perform(put("/jobs/1/cvs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .with(authentication(authAs(CANDIDATE_ID, UserRole.ROLE_USER))))
                .andExpect(status().isOk());
        verify(this.cvService, never()).updateCVStatus(any(UpdateCvStatusCommand.class));
    }
}
