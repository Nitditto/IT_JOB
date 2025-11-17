package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CVDTO {
    private Long accountID;
    private Long jobID;

    private String name;
    private String phone;
    private String cvFile;
    private String referral;
    
}
