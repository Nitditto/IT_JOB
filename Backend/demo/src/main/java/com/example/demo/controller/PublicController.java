package com.example.demo.controller;

import java.util.List; // Nhớ import cái này
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.CompanyMenuDTO;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.repository.AccountRepository;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "http://localhost:5173") // Chỉ định rõ nguồn FE cho an toàn
public class PublicController {

    @Autowired
    private AccountRepository accountRepository;

    @GetMapping("/top-companies")
    public ResponseEntity<List<CompanyMenuDTO>> getTopCompanies() {
        // 1. Lấy 5 account có role là ROLE_COMPANY
        List<Account> companies = accountRepository.findTop5ByRole(UserRole.ROLE_COMPANY);

        // 2. Chuyển sang DTO nhỏ gọn (chỉ lấy id và name)
        List<CompanyMenuDTO> result = companies.stream()
                .map(account -> new CompanyMenuDTO(account.getId(), account.getName())) 
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}