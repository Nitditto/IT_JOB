package com.example.demo.redis.core.exception;

public class RedisEntityNotFoundException extends RuntimeException {

    public RedisEntityNotFoundException(String message) {
        super(message);
    }

    public RedisEntityNotFoundException(Class<?> entityClass, Object id) {
        super("%s not found with id: %s".formatted(entityClass.getSimpleName(), id));
    }

    public RedisEntityNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
