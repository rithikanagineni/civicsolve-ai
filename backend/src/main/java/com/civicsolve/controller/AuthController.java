package com.civicsolve.controller;

import com.civicsolve.dto.AuthRequestDTO;
import com.civicsolve.dto.AuthResponseDTO;
import com.civicsolve.dto.RegisterRequestDTO;
import com.civicsolve.dto.UserDTO;
import com.civicsolve.entity.User;
import com.civicsolve.repository.UserRepository;
import com.civicsolve.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO authRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getEmail(),
                            authRequest.getPassword()
                    )
            );

            String token = tokenProvider.generateToken(authentication);
            Optional<User> user = userRepository.findByEmail(authRequest.getEmail());

            if (user.isPresent()) {
                UserDTO userDTO = convertToDTO(user.get());
                AuthResponseDTO response = AuthResponseDTO.builder()
                        .token(token)
                        .type("Bearer")
                        .user(userDTO)
                        .build();
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        } catch (Exception e) {
            log.error("Login failed for email: {}", authRequest.getEmail(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO registerRequest) {
        try {
            if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists");
            }

            User user = User.builder()
                    .email(registerRequest.getEmail())
                    .password(passwordEncoder.encode(registerRequest.getPassword()))
                    .firstName(registerRequest.getFirstName())
                    .lastName(registerRequest.getLastName())
                    .role(User.UserRole.valueOf(registerRequest.getRole()))
                    .language(registerRequest.getLanguage())
                    .phone(registerRequest.getPhone())
                    .address(registerRequest.getAddress())
                    .city(registerRequest.getCity())
                    .state(registerRequest.getState())
                    .pinCode(registerRequest.getPinCode())
                    .organizationName(registerRequest.getOrganizationName())
                    .department(registerRequest.getDepartment())
                    .expertiseAreas(registerRequest.getExpertiseAreas())
                    .build();

            User savedUser = userRepository.save(user);
            UserDTO userDTO = convertToDTO(savedUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(userDTO);
        } catch (Exception e) {
            log.error("Registration failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registration failed");
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
