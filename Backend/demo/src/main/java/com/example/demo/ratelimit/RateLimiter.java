package com.example.demo.ratelimit;

public interface RateLimiter {

    boolean tryAcquire(String clientKey, String limitType);
}
