package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.AccountDTO;
import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.DeleteAccountRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RegistrationRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;
import com.example.demo.services.AuthServices;
import com.example.demo.services.JwtServices;
import com.example.demo.services.RefreshTokenServices;
import com.example.demo.services.UserServices;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;



@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserServices userServices;
    private final AuthServices authServices;
    private final RefreshTokenServices refreshTokenServices;
    private final JwtServices jwtServices;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
        @Valid @RequestBody RegistrationRequest request) {
        try {
            userServices.register(request, UserRole.ROLE_USER);
            return ResponseEntity.status(HttpStatus.CREATED).body("Đã đăng ký thành công!");
        } catch (IllegalStateException e) {
            // Email is already used
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    @PostMapping("/register/company")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registerCompany(@Valid @RequestBody RegistrationRequest request) {
        try {
            userServices.register(request, UserRole.ROLE_COMPANY);
            return ResponseEntity.status(HttpStatus.CREATED).body("Đã đăng ký thành công!");
        } catch (IllegalStateException e) {
            // Email is already used
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authServices.login(request);
            
            // Đặt Refresh Token vào HttpOnly Cookie
            ResponseCookie cookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                    .httpOnly(true)
                    .secure(false) // Đặt true nếu chạy HTTPS trong production
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 ngày tương ứng thời hạn token
                    .sameSite("Lax") // Thay đổi tùy theo yêu cầu CORS (Lax phù hợp chạy localhost khác port)
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);
            
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
            
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mật khẩu không chính xác!");
            
        } catch (Exception e) {
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi hệ thống: " + e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String refreshTokenString) {
        if (refreshTokenString == null || refreshTokenString.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Refresh Token is missing!");
        }
        try {
            // Xoay vòng Refresh Token (RTR)
            RefreshToken newRefreshToken = refreshTokenServices.rotateRefreshToken(refreshTokenString);
            
            // Tạo Access Token mới
            String newAccessToken = jwtServices.generateToken(newRefreshToken.getAccount());
            
            // Đặt Refresh Token mới vào Cookie
            ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken.getToken())
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            LoginResponse response = new LoginResponse(newAccessToken, null, newRefreshToken.getAccount().getId());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@CookieValue(name = "refreshToken", required = false) String refreshTokenString) {
        if (refreshTokenString != null && !refreshTokenString.isEmpty()) {
            refreshTokenServices.revokeToken(refreshTokenString);
        }
        
        // Xóa cookie ở client bằng cách set maxAge = 0
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Đăng xuất thành công!");
    }
    

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal Account currentUser){
        try {
           AccountDTO accountDTO = userServices.convertToBrief(currentUser);
            return ResponseEntity.ok(accountDTO);
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal Account currentUser
    ) {
        try {
            authServices.changePassword(currentUser, request);
            return ResponseEntity.ok("Đổi mật khẩu thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteAccount(
            @Valid @RequestBody DeleteAccountRequest request,
            @AuthenticationPrincipal Account currentUser
    ) {
        try {
            authServices.deleteAccount(currentUser, request.getPassword());
            return ResponseEntity.ok("Đã xóa tài khoản thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
