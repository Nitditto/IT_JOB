package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.HomepageRequest;
import com.example.demo.model.Location;
import com.example.demo.services.JobServices;
import com.example.demo.services.LocationServices;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;


@RestController @RequiredArgsConstructor
public class HomepageController {
    private final LocationServices locationServices;
    private final JobServices jobServices;

    
    @GetMapping("/")
    public ResponseEntity<HomepageRequest> homepageResponse() {
        long jobCount = jobServices.getJobCount();
        List<Location> locations = locationServices.getAllLocations();

        return ResponseEntity.ok(new HomepageRequest(jobCount, locations));
    }
}
