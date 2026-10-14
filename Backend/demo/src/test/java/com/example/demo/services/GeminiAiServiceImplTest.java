package com.example.demo.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.example.demo.dto.request.AiGenerateRequest;
import com.example.demo.exception.ServiceUnavailableException;
import com.example.demo.services.impl.GeminiAiServiceImpl;

class GeminiAiServiceImplTest {

    private static final String BASE_URL = "http://gemini.test";
    private static final String ENDPOINT = BASE_URL + "/v1beta/models/gemini-2.5-flash:generateContent";

    private MockRestServiceServer server;
    private RestClient.Builder builder;

    @BeforeEach
    void setUp() {
        this.builder = RestClient.builder();
        this.server = MockRestServiceServer.bindTo(this.builder).build();
    }

    private GeminiAiServiceImpl service(final String apiKey) {
        return new GeminiAiServiceImpl(this.builder, BASE_URL, apiKey, "gemini-2.5-flash");
    }

    private AiGenerateRequest request(final String prompt) {
        final AiGenerateRequest request = new AiGenerateRequest();
        request.setPrompt(prompt);
        return request;
    }

    @Test
    void missingApiKeyFailsWithoutCallingGemini() {
        assertThatThrownBy(() -> this.service("").generate(this.request("hi")))
                .isInstanceOf(ServiceUnavailableException.class);
        this.server.verify();
    }

    @Test
    void sendsKeyInHeaderAndJoinsTextParts() {
        this.server.expect(requestTo(ENDPOINT))
                .andExpect(header("x-goog-api-key", "secret"))
                .andExpect(jsonPath("$.contents[0].role").value("model"))
                .andExpect(jsonPath("$.contents[1].parts[0].text").value("question"))
                .andRespond(withSuccess(
                        "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"foo\"},{\"text\":\"bar\"}]}}]}",
                        MediaType.APPLICATION_JSON));
        final AiGenerateRequest request = this.request("question");
        final AiGenerateRequest.Turn turn = new AiGenerateRequest.Turn();
        turn.setRole("model");
        turn.setText("earlier");
        request.setHistory(List.of(turn));

        assertThat(this.service("secret").generate(request).getText()).isEqualTo("foobar");
        this.server.verify();
    }

    @Test
    void upstreamErrorBecomesServiceUnavailable() {
        this.server.expect(requestTo(ENDPOINT)).andRespond(withServerError());

        assertThatThrownBy(() -> this.service("secret").generate(this.request("hi")))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void emptyCandidatesBecomeServiceUnavailable() {
        this.server.expect(requestTo(ENDPOINT))
                .andRespond(withSuccess("{\"candidates\":[]}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> this.service("secret").generate(this.request("hi")))
                .isInstanceOf(ServiceUnavailableException.class);
    }
}
