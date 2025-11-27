package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;

public interface CVRepository extends JpaRepository<CV, CVId>{
    List<CV> findByAccount(Account account);
    List<CV> findByJob(Job job);
    void deleteAllByJobId(Long jobId); 
}
