package com.example.demo.dto;

import com.example.demo.enums.CompanyModel;
import com.example.demo.enums.CompanyScale;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    // --- Chung cho cả 2 ---
    private String name;
    private String phone;
    private String address;
    private String location; // Nhận mã vùng (VD: "HN")
    private String description;
    private String avatar; // Base64 string

    // --- Riêng cho Company ---
    private CompanyModel model;
    private CompanyScale scale;
    private Long startWork;
    private Long endWork;
    private Boolean hasOvertime;
    
    // --- Riêng cho User ---
    private String lookingfor; // Vị trí mong muốn
}