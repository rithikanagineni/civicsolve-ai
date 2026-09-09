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
public class CreateProjectRequestDTO {
    @NotBlank(message = "Challenge ID is required")
    private String challengeId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String objectives;

    private Double budget;
}
