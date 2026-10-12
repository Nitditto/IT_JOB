package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;



public interface AccountRepository extends JpaRepository<Account, Long>{

    Optional<Account> findByEmail(String email);
    Optional<Account> findByName(String name);

    boolean existsByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"location"})
    List<Account> findByRole(UserRole role);
}
