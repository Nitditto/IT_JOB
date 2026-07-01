package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.request.CompanyEditRequest;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.dto.request.UserEditRequest;
import com.example.demo.model.Account;
import com.example.demo.services.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping
@Slf4j
public class UserController {
    
    private final UserService userService;

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        log.info("REST request to get user: {}", id);
        UserResponse user = userService.convertToUser(userService.getUserById(id));
        return ResponseEntity.ok(user);
    }
    
    @GetMapping("/companies/{id}")
    public ResponseEntity<CompanyResponse> getCompany(@PathVariable Long id) {
        log.info("REST request to get company: {}", id);
        CompanyResponse company = userService.convertToCompany(userService.getUserById(id));
        return ResponseEntity.ok(company);
    }

    @GetMapping("/companies")
    public ResponseEntity<List<CompanyResponse>> getCompanyList(@RequestParam(required = false) Integer limit) {
        log.info("REST request to get company list (limit={})", limit);
        List<CompanyResponse> dtos = userService.getCompanyListSortedByJobs(limit);
        return ResponseEntity.ok(dtos);
    }
    
    @PutMapping("/users/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserResponse> editUser(@Valid @RequestBody UserEditRequest request, @AuthenticationPrincipal Account account) {
        log.info("REST request to edit user profile: {}", account.getEmail());
        Account updated = userService.editUser(account.getId(), request);
        return ResponseEntity.ok(userService.convertToUser(updated));
    }

    @PutMapping("/companies/me")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<CompanyResponse> editCompany(@Valid @RequestBody CompanyEditRequest request, @AuthenticationPrincipal Account account) {
        log.info("REST request to edit company profile: {}", account.getEmail());
        Account updated = userService.editCompany(account.getId(), request);
        return ResponseEntity.ok(userService.convertToCompany(updated));
    }
}
