package com.example.demo.redis.core.exception;

public class RedisSyncException extends RuntimeException {

    public RedisSyncException(String message) {
        super(message);
    }

    public RedisSyncException(String message, Throwable cause) {
        super(message, cause);
    }
}
