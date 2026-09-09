package com.civicsolve.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequestDTO {
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Role is required")
    private String role; // ROLE_CITIZEN, ROLE_UNIVERSITY, etc.

    private String language;

    private String phone;

    private String address;

    private String city;

    private String state;

    private String pinCode;

    private String organizationName;

    private String department;

    private String expertiseAreas;
}
