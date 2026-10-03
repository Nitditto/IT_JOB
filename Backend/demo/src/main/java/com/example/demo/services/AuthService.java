package com.example.demo.services;

import com.example.demo.dto.request.ChangePasswordRequest;
import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.model.Account;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void changePassword(Account user, ChangePasswordRequest request);
    void deleteAccount(Account user, String password);
}
