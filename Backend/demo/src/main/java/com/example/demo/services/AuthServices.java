package com.example.demo.services;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.model.Account;
import com.example.demo.repository.AccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServices {

    private final AuthenticationManager authenticationManager;
    private final AccountRepository accountRepository;
    private final JwtServices jwtServices;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        // 1. Authenticate the user. This is the only time the DB is hit for validation.
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        // 2. Get the UserDetails object that was created during authentication.
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 3. Find the user entity to get details for the response (like the ID).
        // This is a quick lookup and avoids re-validating the password.
        Account user = accountRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("User not found after authentication"));

        // 4. Generate the token using the already-created UserDetails.
        String token = jwtServices.generateToken(userDetails);

        // 5. Return the response DTO.
        return new LoginResponse(token, user.getId());
        
    }
    public void changePassword(Account user, ChangePasswordRequest request) {
        // 1. Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalStateException("Mật khẩu hiện tại không chính xác!");
        }

        // 2. Kiểm tra khớp mật khẩu mới
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalStateException("Mật khẩu xác nhận không khớp!");
        }

        // 3. Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(user);
    }
}