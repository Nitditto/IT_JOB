package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Location;
import com.example.demo.services.LocationServices;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequiredArgsConstructor
public class LocationController {

    private final LocationServices locationServices;

    @GetMapping("/location")
    public List<Location> getLocation(@RequestParam(required = false) String abbreviation) {
        if (abbreviation != null) {
            return List.of(locationServices.getLocation(abbreviation));
        } else return locationServices.getAllLocations();
    }

    
    
}
