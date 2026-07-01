package com.example.demo.services.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.ChangePasswordRequest;
import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;
import com.example.demo.repository.AccountRepository;
import com.example.demo.services.AuthService;
import com.example.demo.services.JwtService;
import com.example.demo.services.RefreshTokenService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("Attempting login for user: {}", request.getEmail());
        
        Account user = accountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found with email: {}", request.getEmail());
                    return new ResourceNotFoundException("Tài khoản không tồn tại!");
                });

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        log.info("User {} logged in successfully", request.getEmail());
        return new LoginResponse(token, refreshToken.getToken(), user.getId());
    }

    @Override
    public void changePassword(Account user, ChangePasswordRequest request) {
        log.info("Attempting password change for user: {}", user.getEmail());

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            log.warn("Password change failed for user {}: Incorrect current password", user.getEmail());
            throw new BadRequestException("Mật khẩu hiện tại không chính xác!");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            log.warn("Password change failed for user {}: New passwords do not match", user.getEmail());
            throw new BadRequestException("Mật khẩu xác nhận không khớp!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(user);
        log.info("Password changed successfully for user: {}", user.getEmail());
    }

    @Override
    public void deleteAccount(Account user, String password) {
        log.info("Attempting account deletion for user: {}", user.getEmail());

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Account deletion failed for user {}: Incorrect password", user.getEmail());
            throw new BadRequestException("Mật khẩu không chính xác!");
        }

        accountRepository.delete(user);
        log.info("Account deleted successfully for user: {}", user.getEmail());
    }
}
