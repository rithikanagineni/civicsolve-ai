package com.civicsolve.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String language;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pinCode;
    private String organizationName;
    private String department;
    private String expertiseAreas;
    private String bio;
    private String profileImageUrl;
    private Boolean active;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
