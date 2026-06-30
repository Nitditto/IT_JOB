package com.example.demo.config.filter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

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
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // Lấy IP gốc đầu tiên nếu đi qua Proxy/Load Balancer
    }

    private String getLimitType(String uri) {
        if (uri.startsWith("/auth/login") || uri.startsWith("/auth/register")) {
            return "AUTH";
        } else if (uri.contains("/apply") || uri.contains("/upload")) {
            return "UPLOAD";
        }
        return "GENERAL";
    }

    private Bucket createNewBucket(String limitType) {
        switch (limitType) {
            case "AUTH":
                // Tối đa 5 request mỗi phút cho Login/Register
                return Bucket.builder()
                        .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                        .build();
            case "UPLOAD":
                // Tối đa 10 request mỗi phút cho Nộp CV/Upload file
                return Bucket.builder()
                        .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1))))
                        .build();
            default:
                // Tối đa 100 request mỗi phút cho các API tìm kiếm/công khai khác
                return Bucket.builder()
                        .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
                        .build();
        }
    }
}
