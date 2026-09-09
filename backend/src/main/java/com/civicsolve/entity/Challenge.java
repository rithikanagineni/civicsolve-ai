package com.civicsolve.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "challenges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true)
    private String complaintCode;

    @NotBlank
    @Column(name = "citizen_id")
    private String citizenId;

    @NotBlank
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    private String subcategory;

    private String location;

    private String landmark;

    @Enumerated(EnumType.STRING)
    private SeverityLevel severity;

    private String duration;

    private Integer peopleAffected;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "input_method")
    private String inputMethod; // VOICE or TEXT

    @Column(name = "original_language")
    private String originalLanguage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ChallengeStatus status = ChallengeStatus.REPORTED;

    @Column(name = "community_votes")
    @Builder.Default
    private Integer communityVotes = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SeverityLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum ChallengeStatus {
        REPORTED, AI_ANALYZED, PRIORITIZED, UNIVERSITY_MATCHED, ACCEPTED, PROJECT_CREATED, INDUSTRY_SUPPORT, DEVELOPMENT, TESTING, IMPLEMENTATION, COMPLETED, CLOSED
    }
}
