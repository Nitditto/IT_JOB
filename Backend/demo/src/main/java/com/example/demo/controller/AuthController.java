package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;

import com.example.demo.constants.SecurityConstants;
import com.example.demo.dto.response.AccountResponse;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.request.ChangePasswordRequest;
import com.example.demo.dto.request.DeleteAccountRequest;
import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;
import com.example.demo.services.AuthService;
import com.example.demo.services.JwtService;
import com.example.demo.services.RefreshTokenService;
import com.example.demo.services.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    private ResponseCookie buildRefreshTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(SecurityConstants.REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path(SecurityConstants.REFRESH_TOKEN_COOKIE_PATH)
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> registerUser(@Valid @RequestBody RegistrationRequest request) {
        log.info("REST request to register candidate: {}", request.getEmail());
        userService.register(request, UserRole.ROLE_USER);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null, "Đã đăng ký thành công!"));
    }

    @PostMapping("/register/company")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> registerCompany(@Valid @RequestBody RegistrationRequest request) {
        log.info("REST request to register company: {}", request.getEmail());
        userService.register(request, UserRole.ROLE_COMPANY);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null, "Đã đăng ký thành công!"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> loginUser(@Valid @RequestBody LoginRequest request) {
        log.info("REST request to login user: {}", request.getEmail());
        LoginResponse response = authService.login(request);

        ResponseCookie cookie = buildRefreshTokenCookie(response.getRefreshToken(), SecurityConstants.REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@CookieValue(name = SecurityConstants.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshTokenString) {
        log.info("REST request to refresh access token");
        if (refreshTokenString == null || refreshTokenString.isEmpty()) {
            throw new org.springframework.security.authentication.BadCredentialsException("Refresh Token is missing!");
        }

        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshTokenString);
        String newAccessToken = jwtService.generateToken(newRefreshToken.getAccount());

        ResponseCookie cookie = buildRefreshTokenCookie(newRefreshToken.getToken(), SecurityConstants.REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS);

        LoginResponse response = new LoginResponse(newAccessToken, null, newRefreshToken.getAccount().getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logoutUser(@CookieValue(name = SecurityConstants.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshTokenString) {
        log.info("REST request to logout user");
        if (refreshTokenString != null && !refreshTokenString.isEmpty()) {
            refreshTokenService.revokeToken(refreshTokenString);
        }

        ResponseCookie cookie = buildRefreshTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(null, "Đăng xuất thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AccountResponse>> getCurrentUser(@AuthenticationPrincipal Account currentUser) {
        log.info("REST request to get current user info: {}", currentUser.getEmail());
        AccountResponse accountResponse = userService.convertToBrief(currentUser);
        return ResponseEntity.ok(ApiResponse.success(accountResponse));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal Account currentUser
    ) {
        log.info("REST request to change password for user: {}", currentUser.getEmail());
        authService.changePassword(currentUser, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công!"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @Valid @RequestBody DeleteAccountRequest request,
            @AuthenticationPrincipal Account currentUser
    ) {
        log.info("REST request to delete account: {}", currentUser.getEmail());
        authService.deleteAccount(currentUser, request.getPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa tài khoản thành công!"));
    }
}
