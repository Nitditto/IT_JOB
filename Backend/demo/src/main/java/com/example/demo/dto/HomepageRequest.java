package com.example.demo.dto;

import java.util.List;

import com.example.demo.model.Location;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class HomepageRequest {
    private long jobCount;
    private List<Location> locations;
}
