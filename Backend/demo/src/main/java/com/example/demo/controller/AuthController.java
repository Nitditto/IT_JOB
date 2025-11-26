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
import com.example.demo.services.AuthServices;
import com.example.demo.services.UserServices;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;



@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserServices userServices;
    private final AuthServices authServices;

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
            return ResponseEntity.ok(response);
            
        } catch (UsernameNotFoundException e) {
            // Trường hợp 1: Không tìm thấy email trong DB
            // Trả về 400 hoặc 404 tùy bạn, ở đây để 400 Bad Request
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage()); // "Tài khoản không tồn tại!"
            
        } catch (AuthenticationException e) {
            // Trường hợp 2: Tìm thấy email nhưng sai mật khẩu
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mật khẩu không chính xác!");
            
        } catch (Exception e) {
            // Các lỗi khác
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi hệ thống");
        }
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
