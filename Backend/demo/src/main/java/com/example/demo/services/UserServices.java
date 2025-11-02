package com.example.demo.services;

import java.security.Principal;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dto.RegistrationRequest;
import com.example.demo.dto.UserDTO;
import com.example.demo.enums.UserRole;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class UserServices {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    public User register(RegistrationRequest request, UserRole role) {
        // Check if email already exists
        if (!userRepository.findByEmail(request.getEmail()).isEmpty()) {
            throw new IllegalStateException("Email đã được sử dụng!");
        }

        // Create user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(role);
        // Encrypt password before setting it
        String encryptedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(encryptedPassword);

        return userRepository.save(user);
    }

    public UserDTO convertToDTO(User user) {
        return new UserDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getAvatar(),
            user.getPhone(),
            user.getDescription(),
            user.getStatus(),
            user.getLookingfor(),
            user.getAddress(),
            user.getLocation()
        );
    }
    
    public UserDTO getCurrentUser(Principal principal) {
        String email = principal.getName();

        User user = userRepository.findByEmail(email)
        .orElseThrow(()->new UsernameNotFoundException("Username not found"));
        return convertToDTO(user);
    }
}
