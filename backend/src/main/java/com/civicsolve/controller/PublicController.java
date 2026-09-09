package com.civicsolve.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PublicController {

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "CiviSolve AI Backend is running");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    public ResponseEntity<?> info() {
        Map<String, Object> response = new HashMap<>();
        response.put("name", "CiviSolve AI");
        response.put("version", "1.0.0");
        response.put("description", "Civic Issue Resolution Platform powered by AI");
        return ResponseEntity.ok(response);
    }
}
