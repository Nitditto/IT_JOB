package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;



public interface AccountRepository extends CrudRepository<Account, Long>{

    Optional<Account> findByEmail(String email);
    Optional<Account> findByName(String name);
    List<Account> findByRole(UserRole role);
}

