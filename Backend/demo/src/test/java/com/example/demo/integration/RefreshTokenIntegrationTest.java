package com.example.demo.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.model.Account;
import com.example.demo.model.RefreshToken;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.services.RefreshTokenService;
import com.example.demo.services.UserService;
import com.example.demo.util.TokenHasher;

class RefreshTokenIntegrationTest extends BasePostgresIntegrationTest {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserService userService;

    private Account newAccount() {
        final RegistrationRequest request = new RegistrationRequest();
        request.setName("user");
        request.setEmail(UUID.randomUUID() + "@test.local");
        request.setPassword("Passw0rd!");
        return this.userService.register(request, UserRole.ROLE_USER);
    }

    @Test
    void tokenIsStoredAsHashNotPlaintext() {
        final RefreshToken issued = this.refreshTokenService.createRefreshToken(this.newAccount());

        assertThat(issued.getToken()).isNotBlank();
        final RefreshToken stored = this.refreshTokenRepository.findByTokenHash(TokenHasher.sha256Hex(issued.getToken())).orElseThrow();
        assertThat(stored.getTokenHash()).isNotEqualTo(issued.getToken());
    }

    @Test
    void reusingRotatedTokenRevokesEveryActiveToken() {
        final Account account = this.newAccount();
        final RefreshToken first = this.refreshTokenService.createRefreshToken(account);
        final RefreshToken second = this.refreshTokenService.rotateRefreshToken(first.getToken());

        assertThrows(UnauthorizedException.class, () -> this.refreshTokenService.rotateRefreshToken(first.getToken()));

        assertThat(this.refreshTokenRepository.findAllByAccountAndRevokedFalse(account)).isEmpty();
        assertThrows(UnauthorizedException.class, () -> this.refreshTokenService.rotateRefreshToken(second.getToken()));
    }

    @Test
    void concurrentRotationOfSameTokenSucceedsOnlyOnce() throws Exception {
        final RefreshToken token = this.refreshTokenService.createRefreshToken(this.newAccount());
        final int threads = 2;
        final ExecutorService executor = Executors.newFixedThreadPool(threads);
        final CountDownLatch ready = new CountDownLatch(threads);
        final CountDownLatch start = new CountDownLatch(1);
        final Callable<Boolean> rotate = () -> {
            ready.countDown();
            start.await();
            try {
                this.refreshTokenService.rotateRefreshToken(token.getToken());
                return true;
            } catch (UnauthorizedException ex) {
                return false;
            }
        };
        final List<Future<Boolean>> results = List.of(executor.submit(rotate), executor.submit(rotate));
        ready.await();
        start.countDown();

        final long successes = results.stream().filter(result -> {
            try {
                return result.get();
            } catch (Exception ex) {
                throw new IllegalStateException(ex);
            }
        }).count();
        executor.shutdown();

        assertThat(successes).isEqualTo(1);
    }
}
