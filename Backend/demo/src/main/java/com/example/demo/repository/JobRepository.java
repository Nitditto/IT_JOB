package com.example.demo.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.example.demo.model.Job;

public interface JobRepository extends CrudRepository<Job, Long> {
    List<Job> findByNameContainingIgnoreCase(String name);
}