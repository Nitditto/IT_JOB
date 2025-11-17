package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.CVDTO;
import com.example.demo.dto.CompanyDTO;
import com.example.demo.dto.CompanyEditRequest;
import com.example.demo.dto.UserDTO;
import com.example.demo.dto.UserEditRequest;
import com.example.demo.model.Account;
import com.example.demo.services.UserServices;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequiredArgsConstructor
public class UserController {
    
    private final UserServices userServices;

    @GetMapping("/user/{id}")
    public UserDTO getUser(@PathVariable Long id) {
        return userServices.convertToUser(userServices.getUserById(id));
    }
    
    @GetMapping("/company/{id}")
    public CompanyDTO getCompany(@PathVariable Long id) {
        return userServices.convertToCompany(userServices.getUserById(id));
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
