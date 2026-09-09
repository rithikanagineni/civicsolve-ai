package com.civicsolve.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "challenge_ai_analysis")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengeAIAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "challenge_id")
    private String challengeId;

    private String category;

    private String subcategory;

    @Column(columnDefinition = "TEXT")
    private String summary;

    private String severityLevel;

    private String urgencyLevel;

    private Integer priorityScore;

    private String priorityLevel;

    @Column(columnDefinition = "TEXT")
    private String requiredExpertise;

    @Column(columnDefinition = "TEXT")
    private String possibleSolutions;

    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String analysisJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
