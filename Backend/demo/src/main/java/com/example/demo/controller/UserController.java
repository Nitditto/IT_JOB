package com.example.demo.controller;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.CompanyDTO;
import com.example.demo.dto.CompanyEditRequest;
import com.example.demo.dto.UserDTO;
import com.example.demo.dto.UserEditRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.services.JobServices;
import com.example.demo.services.UserServices;

import lombok.RequiredArgsConstructor;



@RestController
@RequiredArgsConstructor
public class UserController {
    
    private final UserServices userServices;
    private final JobServices jobServices;
    @GetMapping("/user/{id}")
    public UserDTO getUser(@PathVariable Long id) {
        return userServices.convertToUser(userServices.getUserById(id));
    }
    
    @GetMapping("/company/{id}")
    public CompanyDTO getCompany(@PathVariable Long id) {
        return userServices.convertToCompany(userServices.getUserById(id));
    }

    @GetMapping("/company/list")
    public List<CompanyDTO> getCompanyList(@RequestBody(required=false) Long limit) {
        List<Account> companies = userServices.getUsersByRole(UserRole.ROLE_COMPANY);
        Collections
        if (limit != null) {

        }
        return userServices.getUsersByRole(UserRole.ROLE_COMPANY).stream()
        .map(userServices::convertToCompany)
        .collect(Collectors.toList());
    }
    

    @PutMapping("/edit/user")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> editUser(@RequestBody UserEditRequest request, @AuthenticationPrincipal Account account) {
        try {
            return ResponseEntity.ok(userServices.convertToUser(userServices.editUser(account.getId(), request)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/edit/company")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<?> editCompany(@RequestBody CompanyEditRequest request, @AuthenticationPrincipal Account account) {
        try {
            return ResponseEntity.ok(userServices.convertToCompany(userServices.editCompany(account.getId(), request)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
