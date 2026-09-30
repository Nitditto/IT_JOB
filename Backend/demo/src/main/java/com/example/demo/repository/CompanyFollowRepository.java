package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Account;
import com.example.demo.model.CompanyFollow;

public interface CompanyFollowRepository extends JpaRepository<CompanyFollow, Long> {
    boolean existsByAccountAndCompany(Account account, Account company);
    Optional<CompanyFollow> findByAccountAndCompany(Account account, Account company);

    @EntityGraph(attributePaths = {"company", "company.location"})
    List<CompanyFollow> findByAccountOrderByCreatedAtDesc(Account account);

    long countByCompany(Account company);
    void deleteByAccountAndCompany(Account account, Account company);
}
