package com.example.demo.dto.request;

import com.example.demo.enums.CompanyModel;
import com.example.demo.enums.CompanyScale;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CompanyEditRequest {
    @NotBlank(message = "Vui lòng nhập tên!")
    private String name;
    @NotBlank(message = "Vui lòng nhập email!")
    @Email(message = "Email không đúng định dạng!")
    private String email;
    private String avatar;
    private String coverImage;
    private String phone;
    private String website;
    private String taxCode;
    private String industry;
    private Integer foundedYear;
    private Boolean verified;
    private String description;
    private String address;
    private String location;
    private CompanyModel model;
    private CompanyScale scale;
    private Long startWork;
    private Long endWork;
    private Boolean hasOvertime;
}

