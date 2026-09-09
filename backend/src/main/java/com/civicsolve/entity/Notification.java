package com.civicsolve.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Column(name = "user_id")
    private String userId;

    @NotBlank
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(name = "related_id")
    private String relatedId; // Challenge ID, Project ID, etc.

    private Boolean read;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        read = false;
    }

    public enum NotificationType {
        PROBLEM_SUBMITTED,
        AI_ANALYSIS_COMPLETED,
        UNIVERSITY_MATCHED,
        UNIVERSITY_ACCEPTED,
        INDUSTRY_JOINED,
        PROJECT_STARTED,
        MILESTONE_COMPLETED,
        PROJECT_COMPLETED,
        FEEDBACK_REQUESTED,
        NEW_MATCHING_CHALLENGE,
        CHALLENGE_ACCEPTED,
        INDUSTRY_SUPPORT_REQUEST,
        PROJECT_UPDATE
    }
}
