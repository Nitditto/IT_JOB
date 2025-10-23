package com.example.demo.services;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServices {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtServices jwtServices;

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
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("User not found after authentication"));

        // 4. Generate the token using the already-created UserDetails.
        String token = jwtServices.generateToken(userDetails);

        // 5. Return the response DTO.
        return new LoginResponse(token, user.getId());
    }
}