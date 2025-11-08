package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.model.Location;
import com.example.demo.repository.LocationRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class LocationServices {
    private final LocationRepository locationRepository;


    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    public Location getLocation(String abbreviation) {
        return locationRepository.findByAbbreviation(abbreviation).orElseThrow();
    }
}
