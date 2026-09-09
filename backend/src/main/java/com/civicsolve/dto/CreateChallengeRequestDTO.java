package com.civicsolve.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateChallengeRequestDTO {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String subcategory;

    @NotBlank(message = "Location is required")
    private String location;

    private String landmark;

    private String severity;

    private String duration;

    private Integer peopleAffected;

    private String imageUrl;

    private String inputMethod; // VOICE or TEXT

    private String originalLanguage;
}
