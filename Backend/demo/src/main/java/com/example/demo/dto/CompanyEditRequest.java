package com.example.demo.dto;

import com.example.demo.enums.CompanyModel;
import com.example.demo.enums.CompanyScale;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CompanyEditRequest {
    private String name;
    private String email;
    private String avatar;
    private String phone;
    private String description;
    private String address;
    private String location;
    private CompanyModel model;
    private CompanyScale scale;
    private Long startWork;
    private Long endWork;
    private Boolean hasOvertime;
}
