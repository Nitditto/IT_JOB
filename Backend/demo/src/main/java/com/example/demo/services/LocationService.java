package com.example.demo.services;

import java.util.List;

import com.example.demo.model.Location;

public interface LocationService {
    List<Location> getAllLocations();
    Location getLocation(String abbreviation);
}
