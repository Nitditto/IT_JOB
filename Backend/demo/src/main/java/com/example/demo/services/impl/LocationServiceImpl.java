package com.example.demo.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Location;
import com.example.demo.repository.LocationRepository;
import com.example.demo.services.LocationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    @Override
    public List<Location> getAllLocations() {
        log.info("Fetching all locations");
        return locationRepository.findAll();
    }

    @Override
    public Location getLocation(String abbreviation) {
        log.info("Fetching location by abbreviation: {}", abbreviation);
        return locationRepository.findByAbbreviation(abbreviation)
                .orElseThrow(() -> {
                    log.warn("Location not found with abbreviation: {}", abbreviation);
                    return new ResourceNotFoundException("Địa điểm không tồn tại với mã: " + abbreviation);
                });
    }
}
