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
public class ChallengeMatchDTO {
    private String id;
    private String challengeId;
    private String entityId;
    private String matchType; // UNIVERSITY or INDUSTRY
    private Double matchScore;
    private String matchReasons;
    private String status;
    private LocalDateTime acceptedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserDTO entity;
}
