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
public class ProjectMilestoneDTO {
    private String id;
    private String projectId;
    private String title;
    private String description;
    private Integer sequenceOrder;
    private Integer progressPercentage;
    private String status;
    private LocalDateTime dueDate;
    private LocalDateTime completedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
