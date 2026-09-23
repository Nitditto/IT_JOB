package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.model.Location;
import com.example.demo.services.LocationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/locations")
@Slf4j
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Location>>> getLocation(@RequestParam(required = false) String abbreviation) {
        log.info("REST request to get locations (abbreviation={})", abbreviation);
        if (abbreviation != null && !abbreviation.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(locationService.getLocation(abbreviation))));
        }
        return ResponseEntity.ok(ApiResponse.success(locationService.getAllLocations()));
    }
}

