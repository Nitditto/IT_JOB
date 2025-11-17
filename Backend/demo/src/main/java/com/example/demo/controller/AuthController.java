package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RegistrationRequest;
import com.example.demo.dto.UserDTO;
import com.example.demo.enums.UserRole;
import com.example.demo.model.User;
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
    public ResponseEntity<?> loginUser(
        @Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authServices.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai tài khoản hoặc mật khẩu!");
        }
    }
    

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User currentUser){
        try {
           UserDTO userDTO = userServices.convertToDTO(currentUser);
            return ResponseEntity.ok(userDTO);
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    
}
