package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.AiGenerateRequest;
import com.example.demo.dto.response.AiGenerateResponse;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.services.AiService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ai")
@Slf4j
public class AiController {

    private final AiService aiService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<AiGenerateResponse>> generate(@Valid @RequestBody AiGenerateRequest request) {
        log.info("REST request to generate AI content (history turns: {})",
                request.getHistory() == null ? 0 : request.getHistory().size());
        return ResponseEntity.ok(ApiResponse.success(this.aiService.generate(request)));
    }
}
