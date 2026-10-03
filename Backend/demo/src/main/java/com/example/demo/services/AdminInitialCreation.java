package com.example.demo.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.repository.AccountRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitialCreation implements CommandLineRunner {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.initial-password:}")
    private String configuredInitialPassword;

    @Override
    public void run(String... args) throws Exception {
        if (accountRepository.findByName("admin").isEmpty()) {
            String initialPassword = resolveInitialPassword();

            Account admin = new Account();
            admin.setName("admin");
            admin.setEmail("admin@it.job");
            admin.setPassword(passwordEncoder.encode(initialPassword));
            admin.setRole(UserRole.ROLE_ADMIN);

            accountRepository.save(admin);
            log.info("Đã khởi tạo tài khoản admin (admin@it.job)");
        }
    }

    private String resolveInitialPassword() {
        if (configuredInitialPassword != null && !configuredInitialPassword.isBlank()) {
            return configuredInitialPassword;
        }
        String generatedPassword = UUID.randomUUID().toString();
        log.warn("ADMIN_INITIAL_PASSWORD chưa được cấu hình — tự sinh mật khẩu ngẫu nhiên cho tài khoản admin.");
        log.warn("Mật khẩu admin được sinh (chỉ hiện 1 lần, hãy đổi ngay sau khi đăng nhập): {}", generatedPassword);
        return generatedPassword;
    }
}
