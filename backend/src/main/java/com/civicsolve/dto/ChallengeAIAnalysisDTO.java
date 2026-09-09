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
public class ChallengeAIAnalysisDTO {
    private String id;
    private String challengeId;
    private String category;
    private String subcategory;
    private String summary;
    private String severityLevel;
    private String urgencyLevel;
    private Integer priorityScore;
    private String priorityLevel;
    private String requiredExpertise;
    private String possibleSolutions;
    private Double confidence;
    private LocalDateTime createdAt;
}
