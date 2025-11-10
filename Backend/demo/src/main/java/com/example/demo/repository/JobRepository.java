package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.demo.dto.TagDTO;
import com.example.demo.model.Job;

public interface JobRepository extends JpaRepository<Job, Long>, JobRepositoryCustom {
    List<Job> findByNameContainingIgnoreCase(String name);
    List<Job> findByCompanyID(Long companyID);

    @Query("SELECT new com.example.demo.dto.TagDTO(t, COUNT(t)) " +
    "FROM Job j JOIN j.tags t " +
    "GROUP BY t "+
    "ORDER BY COUNT(t) DESC")
    List<TagDTO> findAllTags();
}