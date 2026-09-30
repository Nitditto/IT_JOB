package com.example.demo.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.CompanyFollowResponse;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.BadRequestException;
import com.example.demo.model.Account;
import com.example.demo.model.CompanyFollow;
import com.example.demo.repository.CompanyFollowRepository;
import com.example.demo.services.CompanyFollowService;
import com.example.demo.services.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyFollowServiceImpl implements CompanyFollowService {

    private final CompanyFollowRepository companyFollowRepository;
    private final UserService userService;

    @Override
    @Transactional
    public CompanyFollowResponse followCompany(Long companyId, Account account) {
        Account company = getCompany(companyId);
        return companyFollowRepository.findByAccountAndCompany(account, company)
                .map(this::toResponse)
                .orElseGet(() -> {
                    CompanyFollow follow = new CompanyFollow();
                    follow.setAccount(account);
                    follow.setCompany(company);
                    log.info("Account {} followed Company {}", account.getId(), companyId);
                    return toResponse(companyFollowRepository.save(follow));
                });
    }

    @Override
    @Transactional
    public void unfollowCompany(Long companyId, Account account) {
        Account company = getCompany(companyId);
        companyFollowRepository.deleteByAccountAndCompany(account, company);
        log.info("Account {} unfollowed Company {}", account.getId(), companyId);
    }

    @Override
    public List<CompanyFollowResponse> getFollowedCompanies(Account account) {
        return companyFollowRepository.findByAccountOrderByCreatedAtDesc(account).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public boolean isFollowing(Long companyId, Account account) {
        return companyFollowRepository.existsByAccountAndCompany(account, getCompany(companyId));
    }

    @Override
    public long countFollowers(Long companyId) {
        return companyFollowRepository.countByCompany(getCompany(companyId));
    }

    private CompanyFollowResponse toResponse(CompanyFollow follow) {
        return new CompanyFollowResponse(
                follow.getId(),
                follow.getCreatedAt(),
                userService.convertToCompany(follow.getCompany()));
    }

    private Account getCompany(Long companyId) {
        Account company = userService.getUserById(companyId);
        if (company.getRole() != UserRole.ROLE_COMPANY) {
            throw new BadRequestException("Tài khoản này không phải nhà tuyển dụng!");
        }
        return company;
    }
}
