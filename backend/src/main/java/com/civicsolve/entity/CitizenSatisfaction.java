package com.civicsolve.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "citizen_satisfaction")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CitizenSatisfaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Column(name = "challenge_id")
    private String challengeId;

    @NotBlank
    @Column(name = "project_id")
    private String projectId;

    @NotBlank
    @Column(name = "citizen_id")
    private String citizenId;

    private Integer rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    private Boolean resolved;

    @Column(columnDefinition = "TEXT")
    private String improvementSuggestion;

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
}
