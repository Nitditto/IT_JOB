package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.CompanyDTO;
import com.example.demo.dto.UserDTO;
import com.example.demo.services.UserServices;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


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


    
}
