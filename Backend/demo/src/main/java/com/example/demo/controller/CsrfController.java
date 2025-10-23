package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
public class CsrfController {

    @GetMapping("/csrf")
    public ResponseEntity<?> getCsrf() {
        return ResponseEntity.ok().build();
    }
    
}
