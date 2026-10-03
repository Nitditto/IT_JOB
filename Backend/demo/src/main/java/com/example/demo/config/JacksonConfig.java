package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * {@code redisObjectMapper} là một bean {@link ObjectMapper}, nên Spring Boot's
 * {@code JacksonAutoConfiguration} (điều kiện {@code @ConditionalOnMissingBean}) không tạo
 * ObjectMapper mặc định nữa — MVC sẽ rơi về mapper trần, thiếu ParameterNamesModule, làm các
 * request DTO dùng {@code @AllArgsConstructor} không deserialize được (500). Khai báo lại mapper
 * chính từ builder của Spring Boot để giữ đúng cấu hình {@code spring.jackson.*} và các module.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper(final Jackson2ObjectMapperBuilder builder) {
        return builder.createXmlMapper(false).build();
    }
}
