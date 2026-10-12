package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.dto.response.TagResponse;
import com.example.demo.model.Job;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    @EntityGraph(attributePaths = {"location"})
    List<Job> findByNameContainingIgnoreCase(String name);

    @EntityGraph(attributePaths = {"location"})
    List<Job> findByCompanyID(Long companyID);

    @Override
    @EntityGraph(attributePaths = {"location"})
    List<Job> findAll();

    @Query("SELECT new com.example.demo.dto.response.TagResponse(t, COUNT(t)) " +
    "FROM Job j JOIN j.tags t " +
    "GROUP BY t "+
    "ORDER BY COUNT(t) DESC")
    List<TagResponse> findAllTags();

    @Query("SELECT j.companyID, COUNT(j) FROM Job j WHERE j.companyID IN :companyIds GROUP BY j.companyID")
    List<Object[]> countByCompanyIds(@Param("companyIds") List<Long> companyIds);

    @Modifying
    @Query("UPDATE Job j SET j.appliedCount = COALESCE(j.appliedCount, 0) + 1 WHERE j.id = :id")
    int incrementAppliedCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Job j SET j.appliedCount = j.appliedCount - 1 WHERE j.id = :id AND j.appliedCount > 0")
    int decrementAppliedCount(@Param("id") Long id);
}
