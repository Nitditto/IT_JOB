package com.example.demo.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.dto.request.CVCreationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

class JacksonConfigTest {

    private static final String CV_JSON = "{\"name\":\"A\",\"phone\":\"0900000000\",\"email\":\"a@b.com\",\"cvFile\":\"cv.pdf\"}";

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class))
            .withUserConfiguration(BareRedisMapperConfig.class, JacksonConfig.class);

    @Test
    void primaryObjectMapperDeserializesAllArgsConstructorRequests() {
        this.contextRunner.run(context -> {
            final ObjectMapper primary = context.getBean(ObjectMapper.class);
            final CVCreationRequest request = primary.readValue(CV_JSON, CVCreationRequest.class);
            assertNotNull(request);
            assertEquals("A", request.getName());
        });
    }

    @Configuration
    static class BareRedisMapperConfig {
        @Bean
        ObjectMapper redisObjectMapper() {
            return new ObjectMapper();
        }
    }
}
