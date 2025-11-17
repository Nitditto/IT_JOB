package com.example.demo.repository;

import org.springframework.data.repository.CrudRepository;

import com.example.demo.model.Account;
import java.util.Optional;


public interface AccountRepository extends CrudRepository<Account, Long>{

    Optional<Account> findByEmail(String email);
    Optional<Account> findByName(String name);
}
