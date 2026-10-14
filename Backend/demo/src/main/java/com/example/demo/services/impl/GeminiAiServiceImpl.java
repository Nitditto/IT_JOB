package com.example.demo.services.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.example.demo.dto.request.AiGenerateRequest;
import com.example.demo.dto.response.AiGenerateResponse;
import com.example.demo.exception.ServiceUnavailableException;
import com.example.demo.services.AiService;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GeminiAiServiceImpl implements AiService {

    private static final String API_KEY_HEADER = "x-goog-api-key";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GeminiAiServiceImpl(
            final RestClient.Builder restClientBuilder,
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com}") final String baseUrl,
            @Value("${gemini.api-key:}") final String apiKey,
            @Value("${gemini.model:gemini-2.5-flash}") final String model) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public AiGenerateResponse generate(final AiGenerateRequest request) {
        if (this.apiKey == null || this.apiKey.isBlank()) {
            throw new ServiceUnavailableException("Tính năng AI chưa được cấu hình trên máy chủ.");
        }
        final JsonNode response = this.callGemini(Map.of("contents", this.buildContents(request)));
        return new AiGenerateResponse(this.extractText(response));
    }

    private JsonNode callGemini(final Map<String, Object> body) {
        try {
            return this.restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", this.model)
                    .header(API_KEY_HEADER, this.apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException exception) {
            log.error("Gemini call failed: {}", exception.getMessage());
            throw new ServiceUnavailableException("Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau.");
        }
    }

    private List<Map<String, Object>> buildContents(final AiGenerateRequest request) {
        final List<Map<String, Object>> contents = new ArrayList<>();
        if (request.getHistory() != null) {
            for (final AiGenerateRequest.Turn turn : request.getHistory()) {
                contents.add(this.content(turn.getRole(), List.of(Map.of("text", turn.getText()))));
            }
        }
        final List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", request.getPrompt()));
        if (request.getInlineData() != null) {
            parts.add(Map.of("inlineData", Map.of(
                    "mimeType", request.getInlineData().getMimeType(),
                    "data", request.getInlineData().getData())));
        }
        contents.add(this.content("user", parts));
        return contents;
    }

    private Map<String, Object> content(final String role, final List<?> parts) {
        final Map<String, Object> content = new LinkedHashMap<>();
        content.put("role", role);
        content.put("parts", parts);
        return content;
    }

    private String extractText(final JsonNode response) {
        final JsonNode parts = response == null
                ? null
                : response.path("candidates").path(0).path("content").path("parts");
        if (parts == null || !parts.isArray() || parts.isEmpty()) {
            throw new ServiceUnavailableException("AI không trả về nội dung, vui lòng thử lại.");
        }
        final StringBuilder text = new StringBuilder();
        for (final JsonNode part : parts) {
            text.append(part.path("text").asText(""));
        }
        return text.toString();
    }
}
