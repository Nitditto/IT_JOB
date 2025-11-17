package com.example.demo.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.UserDTO;
import com.example.demo.services.JobServices;
import com.example.demo.services.UserServices;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    
    private final UserServices userServices;

    @GetMapping("/{id}")
    public UserDTO getUser(@PathVariable Long id) {
        return userServices.convertToDTO(userServices.getUserById(id));
    }
    
}
