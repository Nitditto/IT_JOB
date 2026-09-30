package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.model.SavedJob;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    boolean existsByAccountAndJob(Account account, Job job);
    Optional<SavedJob> findByAccountAndJob(Account account, Job job);

    @EntityGraph(attributePaths = {"job", "job.location"})
    List<SavedJob> findByAccountOrderByCreatedAtDesc(Account account);

    long countByJob(Job job);
    void deleteByAccountAndJob(Account account, Job job);
}
