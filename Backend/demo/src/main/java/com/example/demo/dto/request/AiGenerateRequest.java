package com.example.demo.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AiGenerateRequest {

    private static final int MAX_PROMPT_LENGTH = 20_000;
    private static final int MAX_HISTORY_TURNS = 40;
    private static final int MAX_INLINE_BASE64_LENGTH = 14_000_000;

    @NotBlank
    @Size(max = MAX_PROMPT_LENGTH)
    private String prompt;

    @Size(max = MAX_HISTORY_TURNS)
    @Valid
    private List<Turn> history;

    @Valid
    private InlineData inlineData;

    @Data
    @NoArgsConstructor
    public static class Turn {
        @Pattern(regexp = "user|model")
        private String role;

        @NotBlank
        @Size(max = MAX_PROMPT_LENGTH)
        private String text;
    }

    @Data
    @NoArgsConstructor
    public static class InlineData {
        @Pattern(regexp = "application/pdf|image/png|image/jpeg")
        private String mimeType;

        @NotBlank
        @Size(max = MAX_INLINE_BASE64_LENGTH)
        private String data;
    }
}
