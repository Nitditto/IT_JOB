package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.model.Job;
import com.example.demo.model.User;

public interface CVRepository extends JpaRepository<CV, CVId>{
    List<CV> findByUser(User user);
    List<CV> findByJob(Job job);
}
