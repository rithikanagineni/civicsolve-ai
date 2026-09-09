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
public class NotificationDTO {
    private String id;
    private String userId;
    private String title;
    private String message;
    private String type;
    private String relatedId;
    private Boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
