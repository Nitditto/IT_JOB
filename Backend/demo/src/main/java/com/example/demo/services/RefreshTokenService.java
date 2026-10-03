package com.example.demo.services;

import java.util.Optional;

import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;

public interface RefreshTokenService {
    Optional<RefreshToken> findByToken(String token);
    RefreshToken createRefreshToken(Account account);
    RefreshToken verifyExpiration(RefreshToken token);
    RefreshToken rotateRefreshToken(String oldTokenString);
    void revokeToken(String tokenString);
}
