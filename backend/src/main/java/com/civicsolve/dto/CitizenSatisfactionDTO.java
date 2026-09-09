package com.civicsolve.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CitizenSatisfactionDTO {
    private String id;
    private String challengeId;
    private String projectId;
    private String citizenId;
    @NotNull(message = "Rating is required")
    private Integer rating;
    private String comment;
    private Boolean resolved;
    private String improvementSuggestion;
}
