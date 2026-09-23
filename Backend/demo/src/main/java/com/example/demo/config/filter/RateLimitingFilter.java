package com.example.demo.config.filter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.demo.constants.RateLimitConstants;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(1) // Chạy đầu tiên trong Filter Chain để chặn spam sớm nhất có thể
public class RateLimitingFilter implements Filter {

    // Cache lưu trữ các Bucket theo IP và Loại Endpoint
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String ip = getClientIP(httpRequest);
        String uri = httpRequest.getRequestURI();
        
        // Xác định loại giới hạn dựa trên URI
        String limitType = getLimitType(uri);
        String cacheKey = ip + ":" + limitType;

        // Lấy hoặc tạo mới Bucket cho IP này
        Bucket bucket = cache.computeIfAbsent(cacheKey, k -> createNewBucket(limitType));

        // Thử tiêu thụ 1 token
        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            // Vượt quá giới hạn -> Trả về lỗi 429 Too Many Requests
            httpResponse.setStatus(429); // HttpStatus.TOO_MANY_REQUESTS
            httpResponse.setContentType("text/plain; charset=UTF-8");
            httpResponse.getWriter().write("Tần suất yêu cầu quá nhanh. Vui lòng thử lại sau ít phút!");
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader(RateLimitConstants.FORWARDED_FOR_HEADER);
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // Lấy IP gốc đầu tiên nếu đi qua Proxy/Load Balancer
    }

    private String getLimitType(String uri) {
        if (uri.startsWith("/auth/login") || uri.startsWith("/auth/register")) {
            return RateLimitConstants.AUTH_LIMIT_TYPE;
        } else if (uri.contains("/apply") || uri.contains("/upload")) {
            return RateLimitConstants.UPLOAD_LIMIT_TYPE;
        }
        return RateLimitConstants.GENERAL_LIMIT_TYPE;
    }

    private Bucket createNewBucket(String limitType) {
        int capacity = switch (limitType) {
            case RateLimitConstants.AUTH_LIMIT_TYPE -> RateLimitConstants.AUTH_CAPACITY_PER_MINUTE;
            case RateLimitConstants.UPLOAD_LIMIT_TYPE -> RateLimitConstants.UPLOAD_CAPACITY_PER_MINUTE;
            default -> RateLimitConstants.GENERAL_CAPACITY_PER_MINUTE;
        };
        return Bucket.builder()
                .addLimit(Bandwidth.classic(capacity, Refill.intervally(capacity, Duration.ofMinutes(1))))
                .build();
    }
}

