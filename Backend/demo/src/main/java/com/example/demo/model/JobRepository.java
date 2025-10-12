package com.example.demo.model;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

public interface JobRepository extends CrudRepository<Job, Long> {
    List<Job> findByNameContainingIgnoreCase(String name);
}