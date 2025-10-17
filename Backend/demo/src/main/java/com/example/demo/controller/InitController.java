package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Init;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
public class InitController {
    @GetMapping("/")
    public Init Init() {
        return new Init(696969);
    }
}
