package com.example.demo.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.model.JobView;

public interface JobViewRepository extends JpaRepository<JobView, Long> {
    long countByJob(Job job);
    long countByJobAndViewedAtAfter(Job job, Instant viewedAt);
    Optional<JobView> findFirstByJobAndAccountAndViewedAtAfterOrderByViewedAtDesc(Job job, Account account, Instant viewedAt);
    Optional<JobView> findFirstByJobAndIpAddressAndViewedAtAfterOrderByViewedAtDesc(Job job, String ipAddress, Instant viewedAt);
}
