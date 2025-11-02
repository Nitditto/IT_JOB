package com.example.demo.repository;

import org.springframework.data.repository.CrudRepository;

import com.example.demo.model.User;
import java.util.Optional;


public interface UserRepository extends CrudRepository<User, Long>{

    Optional<User> findByEmail(String email);
    Optional<User> findByName(String name);
}
