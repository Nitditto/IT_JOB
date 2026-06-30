package com.example.demo.services;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;
import com.example.demo.repository.AccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServices {

    private final AuthenticationManager authenticationManager;
    private final AccountRepository accountRepository;
    private final JwtServices jwtServices;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenServices refreshTokenServices;

    public LoginResponse login(LoginRequest request) {
        // --- SỬA ĐỔI TẠI ĐÂY ---
        
        // 1. Kiểm tra xem tài khoản có tồn tại trong DB không trước
        // Nếu không tìm thấy -> Ném lỗi UsernameNotFoundException ngay lập tức
        Account user = accountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Tài khoản không tồn tại!"));

        // 2. Nếu tài khoản tồn tại, tiến hành xác thực mật khẩu qua AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        // 3. Lấy thông tin UserDetails (Lúc này chắc chắn login thành công)
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 4. Tạo access token
        String token = jwtServices.generateToken(userDetails);

        // 5. Tạo refresh token
        RefreshToken refreshToken = refreshTokenServices.createRefreshToken(user);

        // 6. Trả về response chứa cả access token và refresh token
        return new LoginResponse(token, refreshToken.getToken(), user.getId());
    }
    public void changePassword(Account user, ChangePasswordRequest request) {
        // 1. Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalStateException("Mật khẩu hiện tại không chính xác!");
        }

        // 2. Kiểm tra khớp mật khẩu mới
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalStateException("Mật khẩu xác nhận không khớp!");
        }

        // 3. Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(user);
    }

    public void deleteAccount(Account user, String password) {
        // 1. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalStateException("Mật khẩu không chính xác!");
        }

        // 2. Xóa tài khoản
        accountRepository.delete(user);
    }
}