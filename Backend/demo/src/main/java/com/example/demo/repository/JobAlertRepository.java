package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Account;
import com.example.demo.model.JobAlert;

public interface JobAlertRepository extends JpaRepository<JobAlert, Long> {
    @EntityGraph(attributePaths = {"account"})
    List<JobAlert> findByAccountOrderByCreatedAtDesc(Account account);
}
