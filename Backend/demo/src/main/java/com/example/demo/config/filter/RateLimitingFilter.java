package com.example.demo.config.filter;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.demo.constants.RateLimitConstants;
import com.example.demo.ratelimit.RateLimiter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@Order(1) // Chạy đầu tiên trong Filter Chain để chặn spam sớm nhất có thể
@RequiredArgsConstructor
public class RateLimitingFilter implements Filter {

    private final RateLimiter rateLimiter;

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Override
    public void doFilter(final ServletRequest request, final ServletResponse response, final FilterChain chain)
            throws IOException, ServletException {
        final HttpServletRequest httpRequest = (HttpServletRequest) request;
        final HttpServletResponse httpResponse = (HttpServletResponse) response;

        if (!this.enabled) {
            chain.doFilter(request, response);
            return;
        }

        final String limitType = this.getLimitType(httpRequest.getRequestURI());
        if (this.rateLimiter.tryAcquire(this.getClientIP(httpRequest), limitType)) {
            chain.doFilter(request, response);
            return;
        }
        httpResponse.setStatus(429); // HttpStatus.TOO_MANY_REQUESTS
        httpResponse.setContentType("text/plain; charset=UTF-8");
        httpResponse.getWriter().write("Tần suất yêu cầu quá nhanh. Vui lòng thử lại sau ít phút!");
    }

    private String getClientIP(final HttpServletRequest request) {
        // Không tin X-Forwarded-For do client gửi: forward-headers-strategy=framework đã xử lý proxy tin cậy
        return request.getRemoteAddr();
    }

    private String getLimitType(final String uri) {
        if (uri.startsWith("/auth/login") || uri.startsWith("/auth/register")) {
            return RateLimitConstants.AUTH_LIMIT_TYPE;
        } else if (uri.startsWith("/ai/")) {
            return RateLimitConstants.AI_LIMIT_TYPE;
        } else if (uri.contains("/apply") || uri.contains("/upload")) {
            return RateLimitConstants.UPLOAD_LIMIT_TYPE;
        }
        return RateLimitConstants.GENERAL_LIMIT_TYPE;
    }
}
