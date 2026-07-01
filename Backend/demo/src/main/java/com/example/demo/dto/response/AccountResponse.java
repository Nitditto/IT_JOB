package com.example.demo.dto.response;

import com.example.demo.enums.UserRole;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class AccountResponse {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private String avatar;
}

