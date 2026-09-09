package com.civicsolve.controller;

import com.civicsolve.dto.UserDTO;
import com.civicsolve.entity.User;
import com.civicsolve.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(convertToDTO(user));
        } catch (Exception e) {
            log.error("Error fetching user", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(convertToDTO(user));
        } catch (Exception e) {
            log.error("Error fetching user by email", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        try {
            List<User> users = userRepository.findByRole(User.UserRole.valueOf(role));
            List<UserDTO> dtos = users.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching users by role", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching users");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_USER')")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UserDTO request) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
            if (request.getLastName() != null) user.setLastName(request.getLastName());
            if (request.getPhone() != null) user.setPhone(request.getPhone());
            if (request.getAddress() != null) user.setAddress(request.getAddress());
            if (request.getCity() != null) user.setCity(request.getCity());
            if (request.getState() != null) user.setState(request.getState());
            if (request.getPinCode() != null) user.setPinCode(request.getPinCode());
            if (request.getBio() != null) user.setBio(request.getBio());
            if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());

            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(convertToDTO(updatedUser));
        } catch (Exception e) {
            log.error("Error updating user", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error updating user");
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userRepository.deleteById(id);
            return ResponseEntity.ok("User deleted successfully");
        } catch (Exception e) {
            log.error("Error deleting user", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error deleting user");
        }
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().toString())
                .language(user.getLanguage())
                .phone(user.getPhone())
                .address(user.getAddress())
                .city(user.getCity())
                .state(user.getState())
                .pinCode(user.getPinCode())
                .organizationName(user.getOrganizationName())
                .department(user.getDepartment())
                .expertiseAreas(user.getExpertiseAreas())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .active(user.getActive())
                .verified(user.getVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
