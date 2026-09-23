package com.example.demo.constants;

public final class RateLimitConstants {

    private RateLimitConstants() {
    }

    public static final String AUTH_LIMIT_TYPE = "AUTH";
    public static final String UPLOAD_LIMIT_TYPE = "UPLOAD";
    public static final String GENERAL_LIMIT_TYPE = "GENERAL";

    public static final int AUTH_CAPACITY_PER_MINUTE = 5;
    public static final int UPLOAD_CAPACITY_PER_MINUTE = 10;
    public static final int GENERAL_CAPACITY_PER_MINUTE = 100;

    public static final String FORWARDED_FOR_HEADER = "X-Forwarded-For";
}
