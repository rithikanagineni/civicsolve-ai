package com.civicsolve.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "challenge_matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengeMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "challenge_id")
    private String challengeId;

    @Column(name = "entity_id")
    private String entityId; // University or Industry ID

    @Enumerated(EnumType.STRING)
    private MatchType matchType; // UNIVERSITY or INDUSTRY

    private Double matchScore;

    @Column(columnDefinition = "TEXT")
    private String matchReasons;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

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

    public enum MatchType {
        UNIVERSITY, INDUSTRY
    }

    public enum MatchStatus {
        PENDING, ACCEPTED, REJECTED, WITHDRAWN
    }
}
