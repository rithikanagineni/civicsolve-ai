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
public class ProjectDTO {
    private String id;
    private String challengeId;
    private String universityId;
    private String title;
    private String description;
    private String objectives;
    private String industryId;
    private Integer progressPercentage;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime expectedEndDate;
    private LocalDateTime actualEndDate;
    private Double budget;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
