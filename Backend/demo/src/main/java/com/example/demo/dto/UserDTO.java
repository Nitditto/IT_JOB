package com.example.demo.dto;

import com.example.demo.enums.CompanyModel;
import com.example.demo.enums.CompanyScale;
import com.example.demo.enums.UserRole;
import com.example.demo.enums.UserStatus;
import com.example.demo.model.Location;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private String avatar;
    private String phone;
    private String description;
    private UserStatus status;
    private String lookingfor;
    private String address;
    private Location location;
    private CompanyModel model;
    private CompanyScale scale;
    private Long startWork;
    private Long endWork;
    private Boolean hasOvertime;
}
