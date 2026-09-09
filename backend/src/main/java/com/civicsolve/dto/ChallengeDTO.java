package com.civicsolve.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengeDTO {
    private String id;
    private String complaintCode;
    private String citizenId;
    private String title;
    private String description;
    private String category;
    private String subcategory;
    private String location;
    private String landmark;
    private String severity;
    private String duration;
    private Integer peopleAffected;
    private String imageUrl;
    private String inputMethod;
    private String originalLanguage;
    private String status;
    private Integer communityVotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ChallengeAIAnalysisDTO analysis;
    private List<ChallengeMatchDTO> matches;
}
