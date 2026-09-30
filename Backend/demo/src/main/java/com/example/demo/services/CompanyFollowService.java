package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.response.CompanyFollowResponse;
import com.example.demo.model.Account;

public interface CompanyFollowService {
    CompanyFollowResponse followCompany(Long companyId, Account account);
    void unfollowCompany(Long companyId, Account account);
    List<CompanyFollowResponse> getFollowedCompanies(Account account);
    boolean isFollowing(Long companyId, Account account);
    long countFollowers(Long companyId);
}
