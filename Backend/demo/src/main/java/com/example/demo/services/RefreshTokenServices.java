package com.example.demo.services;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;
import com.example.demo.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenServices {

    @Value("${jwt.refresh-token.expiration}")
    private long refreshExpiration;

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Finds a refresh token by its token string.
     */
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Creates a new refresh token for an account.
     */
    @Transactional
    public RefreshToken createRefreshToken(Account account) {
        // Thu hồi tất cả các token cũ chưa hết hạn của tài khoản này để dọn dẹp DB
        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountAndRevokedFalse(account);
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);

        // Tạo token mới
        RefreshToken refreshToken = RefreshToken.builder()
                .account(account)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Verifies if a refresh token has expired.
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please sign in again.");
        }
        if (token.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked.");
        }
        return token;
    }

    /**
     * Implements Refresh Token Rotation (RTR).
     * If the old token is valid, revokes it and issues a new one.
     * If the old token is already revoked, it warns of a reuse attack: revokes ALL tokens for the account.
     */
    @Transactional
    public RefreshToken rotateRefreshToken(String oldTokenString) {
        RefreshToken oldToken = refreshTokenRepository.findByToken(oldTokenString)
                .orElseThrow(() -> new RuntimeException("Refresh token not found."));

        // Phát hiện tấn công tái sử dụng (Reuse Attack)
        if (oldToken.isRevoked()) {
            // Thu hồi toàn bộ token hoạt động của tài khoản này để bảo vệ người dùng
            List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountAndRevokedFalse(oldToken.getAccount());
            for (RefreshToken token : activeTokens) {
                token.setRevoked(true);
            }
            refreshTokenRepository.saveAll(activeTokens);
            throw new RuntimeException("Warning: Refresh token reuse detected! All sessions revoked.");
        }

        // Kiểm tra xem token đã hết hạn chưa
        verifyExpiration(oldToken);

        // Thu hồi token cũ
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        // Tạo token mới
        RefreshToken newToken = RefreshToken.builder()
                .account(oldToken.getAccount())
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(newToken);
    }

    /**
     * Revokes a refresh token (used on logout).
     */
    @Transactional
    public void revokeToken(String tokenString) {
        refreshTokenRepository.findByToken(tokenString).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }
}
