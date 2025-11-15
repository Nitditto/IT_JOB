package com.example.demo.repository;

import com.example.demo.dto.JobFilterDTO;
import com.example.demo.model.Job;
import java.util.List;



public interface JobRepositoryCustom {
    List<Job> findJobsByFilters(JobFilterDTO filters);
}