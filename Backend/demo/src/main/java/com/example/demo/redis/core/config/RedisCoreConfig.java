package com.example.demo.redis.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Bean cho Redis caching framework ({@code com.example.demo.redis.core.*}).
 *
 * Thiết kế cốt lõi: entity được serialize bằng JSON thuần qua {@link #redisObjectMapper()}
 * (KHÔNG dùng Jackson2JsonRedisSerializer của Spring Data Redis) — tránh nhúng metadata kiểu
 * {@code @class} vào JSON lưu trong Redis, giữ data đọc được/portable. {@code RedisTemplate}
 * chỉ dùng {@code StringRedisSerializer} cho key/value, việc chuyển đổi entity ↔ JSON do
 * {@code AbstractRedisRepository} tự làm bằng {@code redisObjectMapper}.
 *
 * {@code redisObjectMapper} KHÔNG đánh {@code @Primary}. Vì nó là một bean {@code ObjectMapper},
 * Spring Boot không tự tạo ObjectMapper mặc định nữa — mapper chính cho REST API được khai báo
 * trong {@code JacksonConfig}. Bean này chỉ inject qua {@code @Qualifier("redisObjectMapper")}.
 */
@Configuration
public class RedisCoreConfig {

    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        return mapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(stringSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
        return new TransactionTemplate(transactionManager);
    }
}
