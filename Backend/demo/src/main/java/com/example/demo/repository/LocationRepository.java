package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Location;


public interface LocationRepository extends JpaRepository<Location, String> {
    Optional<Location> findByAbbreviation(String abbr);
}
