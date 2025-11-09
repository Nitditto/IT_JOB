package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Job;

public interface JobRepository extends JpaRepository<Job, Long>, JobRepositoryCustom {
    List<Job> findByNameContainingIgnoreCase(String name);
    List<Job> findByCompanyID(Long companyID);
}