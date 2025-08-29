package com.example.demo.controller;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.demo.model.Greeting;

@RestController
public class GreetingController {
    
    private static final String template = "Hello %s!";
    private final AtomicLong counter = new AtomicLong();

    @CrossOrigin(origins = "${allowed.cors.origins}")
    @GetMapping("/greetings")
    public Greeting Greetings(@RequestParam(defaultValue = "World") String name) {
        return new Greeting(counter.incrementAndGet(), String.format(template, name));
    }
    
}
