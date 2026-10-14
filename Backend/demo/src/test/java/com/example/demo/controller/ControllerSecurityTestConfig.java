package com.example.demo.controller;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import com.example.demo.ratelimit.InMemoryRateLimiter;
import com.example.demo.ratelimit.RateLimiter;

@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
class ControllerSecurityTestConfig {

    @Bean
    RateLimiter rateLimiter() {
        return new InMemoryRateLimiter();
    }

    @Bean
    SecurityFilterChain testFilterChain(final HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .build();
    }
}
