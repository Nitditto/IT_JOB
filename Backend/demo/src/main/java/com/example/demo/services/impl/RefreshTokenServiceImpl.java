package com.example.demo.services.impl;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.services.RefreshTokenService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenServiceImpl implements RefreshTokenService {

    @Value("${jwt.refresh-token.expiration}")
    private long refreshExpiration;

    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        log.info("Finding refresh token: {}", token);
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(Account account) {
        log.info("Creating new refresh token for user {}", account.getEmail());
        
        List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountAndRevokedFalse(account);
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);

        RefreshToken refreshToken = RefreshToken.builder()
                .account(account)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .revoked(false)
                .build();

        RefreshToken savedToken = refreshTokenRepository.save(refreshToken);
        log.info("Refresh token created successfully for user {}", account.getEmail());
        return savedToken;
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            log.warn("Refresh token expired: {}", token.getToken());
            refreshTokenRepository.delete(token);
            throw new BadRequestException("Refresh token was expired. Please sign in again.");
        }
        if (token.isRevoked()) {
            log.warn("Attempted to use a revoked refresh token: {}", token.getToken());
            throw new BadRequestException("Refresh token has been revoked.");
        }
        return token;
    }

    @Override
    @Transactional
    public RefreshToken rotateRefreshToken(String oldTokenString) {
        log.info("Attempting to rotate refresh token");
        RefreshToken oldToken = refreshTokenRepository.findByToken(oldTokenString)
                .orElseThrow(() -> {
                    log.warn("Rotate failed: Refresh token not found: {}", oldTokenString);
                    return new ResourceNotFoundException("Refresh token not found.");
                });

        if (oldToken.isRevoked()) {
            log.error("WARNING: Refresh token reuse detected! Account: {}. Revoking all active tokens.", oldToken.getAccount().getEmail());
            List<RefreshToken> activeTokens = refreshTokenRepository.findAllByAccountAndRevokedFalse(oldToken.getAccount());
            for (RefreshToken token : activeTokens) {
                token.setRevoked(true);
            }
            refreshTokenRepository.saveAll(activeTokens);
            throw new BadRequestException("Warning: Refresh token reuse detected! All sessions revoked.");
        }

        verifyExpiration(oldToken);

        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        RefreshToken newToken = RefreshToken.builder()
                .account(oldToken.getAccount())
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .revoked(false)
                .build();

        RefreshToken savedNewToken = refreshTokenRepository.save(newToken);
        log.info("Refresh token rotated successfully. New token issued for user {}", oldToken.getAccount().getEmail());
        return savedNewToken;
    }

    @Override
    @Transactional
    public void revokeToken(String tokenString) {
        log.info("Revoking refresh token: {}", tokenString);
        refreshTokenRepository.findByToken(tokenString).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("Refresh token revoked: {}", tokenString);
        });
    }
}
