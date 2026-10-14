package com.example.demo.services;

import com.example.demo.dto.request.AiGenerateRequest;
import com.example.demo.dto.response.AiGenerateResponse;

public interface AiService {

    AiGenerateResponse generate(AiGenerateRequest request);
}
