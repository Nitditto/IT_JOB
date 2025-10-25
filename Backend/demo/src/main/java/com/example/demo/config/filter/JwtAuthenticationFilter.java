package com.example.demo.config.filter;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.demo.services.JwtServices;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtServices jwtServices;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // 1. Lấy header 'Authorization'
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Kiểm tra xem header có tồn tại và có bắt đầu bằng "Bearer " không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Nếu không có token, chuyển cho filter tiếp theo
            return;
        }

        // 3. Trích xuất token từ header (bỏ "Bearer ")
        jwt = authHeader.substring(7);

        // 4. Giải mã token để lấy email (subject)
        userEmail = jwtServices.extractUsername(jwt);

        // 5. Kiểm tra email có tồn tại và user chưa được xác thực trong SecurityContext
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Tải thông tin UserDetails từ database
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 6. Kiểm tra xem token có hợp lệ không
            if (jwtServices.isTokenValid(jwt, userDetails)) {
                // Nếu hợp lệ, tạo đối tượng xác thực
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // credentials, không cần thiết vì đã xác thực bằng token
                        userDetails.getAuthorities()
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 7. Cập nhật SecurityContextHolder
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        // Chuyển request và response cho filter tiếp theo trong chuỗi
        filterChain.doFilter(request, response);
    }
}