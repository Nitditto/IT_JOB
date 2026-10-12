package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;

public interface CVRepository extends JpaRepository<CV, CVId>{
    @EntityGraph(attributePaths = {"job"})
    List<CV> findByAccount(Account account);
    @EntityGraph(attributePaths = {"job"})
    List<CV> findByJob(Job job);
    void deleteAllByJobId(Long jobId); 
}

