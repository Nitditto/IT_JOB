package com.example.demo.services;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.enums.UserRole;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AdminInitialCreation implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String ...args) throws Exception {
        if (userRepository.findByName("admin").isEmpty()) {
            User admin = new User();
            admin.setName("admin");
            admin.setEmail("admin@it.job");
            admin.setPassword(passwordEncoder.encode("xWWlpaAj1%#pS7"));
            admin.setRole(UserRole.ROLE_ADMIN);

            userRepository.save(admin);

            System.out.println("Đã khởi tạo tài khoản admin!");
        }
    }
}
