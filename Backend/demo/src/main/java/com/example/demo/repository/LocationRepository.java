package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Location;
import java.util.Optional;


public interface LocationRepository extends JpaRepository<Location, String> {
    Optional<Location> findByAbbreviation(String abbreviation);
}
