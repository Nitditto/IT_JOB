package com.example.demo.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.example.demo.dto.response.ApiResponse;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void resourceNotFound_mapsTo404_withFormattedMessage() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleResourceNotFound(new ResourceNotFoundException("Job", "id", 42L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Job").contains("42");
    }

    @Test
    void resourceNotFound_withPlainMessage_stillWorks() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleResourceNotFound(new ResourceNotFoundException("Không tìm thấy!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getMessage()).isEqualTo("Không tìm thấy!");
    }

    @Test
    void badRequest_mapsTo400() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleBadRequest(new BadRequestException("Sai rồi"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo("Sai rồi");
    }

    @Test
    void business_mapsTo409Conflict() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleBusiness(new BusinessException("Đã ứng tuyển rồi!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getMessage()).isEqualTo("Đã ứng tuyển rồi!");
    }

    @Test
    void optimisticLock_mapsTo409Conflict() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleOptimisticLock(
                new org.springframework.orm.ObjectOptimisticLockingFailureException(com.example.demo.model.CV.class, 1L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unauthorized_mapsTo401() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleUnauthorized(new UnauthorizedException("Refresh token hết hạn"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().getMessage()).isEqualTo("Refresh token hết hạn");
    }

    @Test
    void customAccessDenied_mapsTo403_andPreservesOwnMessage() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleOwnershipAccessDenied(new AccessDeniedException("Bạn không có quyền xóa công việc này!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage()).isEqualTo("Bạn không có quyền xóa công việc này!");
    }

    @Test
    void springSecurityAccessDenied_mapsTo403_withGenericMessage_notLeakingInternalDetail() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleAccessDenied(
                new org.springframework.security.access.AccessDeniedException("internal role check detail"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage())
                .isEqualTo("Bạn không có quyền truy cập tài nguyên này!")
                .doesNotContain("internal role check detail");
    }

    @Test
    void illegalState_mapsTo400() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleIllegalState(new IllegalStateException("bad state"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void springSecurityAuthenticationException_mapsTo401() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleAuthentication(new BadCredentialsException("Refresh Token is missing!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().getMessage()).isEqualTo("Refresh Token is missing!");
    }

    @Test
    void typeMismatch_mapsTo400_withReadableMessage() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getValue()).thenReturn("khong-hop-le");
        when(ex.getName()).thenReturn("status");

        ResponseEntity<ApiResponse<Void>> response = handler.handleTypeMismatch(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).contains("khong-hop-le").contains("status");
    }

    @Test
    void validationException_mapsTo400_withJoinedFieldErrorMessages() {
        FieldError emailError = new FieldError("request", "email", "Email không hợp lệ");
        FieldError passwordError = new FieldError("request", "password", "Mật khẩu quá ngắn");
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(emailError, passwordError));
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidationExceptions(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage())
                .contains("Email không hợp lệ")
                .contains("Mật khẩu quá ngắn");
    }

    @Test
    void unhandledException_mapsTo500_withoutLeakingInternalMessage() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleGlobalException(new RuntimeException("secret internal stacktrace detail"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).doesNotContain("secret internal stacktrace detail");
    }
}
