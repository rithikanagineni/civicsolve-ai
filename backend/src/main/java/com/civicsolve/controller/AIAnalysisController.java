package com.civicsolve.controller;

import com.civicsolve.dto.ChallengeAIAnalysisDTO;
import com.civicsolve.entity.ChallengeAIAnalysis;
import com.civicsolve.repository.ChallengeAIAnalysisRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AIAnalysisController {

    @Autowired
    private ChallengeAIAnalysisRepository analysisRepository;

    @GetMapping("/challenge/{challengeId}")
    public ResponseEntity<?> getAnalysisForChallenge(@PathVariable String challengeId) {
        try {
            Optional<ChallengeAIAnalysis> analysis = analysisRepository.findByChallengeId(challengeId);
            if (analysis.isPresent()) {
                return ResponseEntity.ok(convertToDTO(analysis.get()));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Analysis not found");
        } catch (Exception e) {
            log.error("Error fetching analysis", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching analysis");
        }
    }

    private ChallengeAIAnalysisDTO convertToDTO(ChallengeAIAnalysis analysis) {
        return ChallengeAIAnalysisDTO.builder()
                .id(analysis.getId())
                .challengeId(analysis.getChallengeId())
                .category(analysis.getCategory())
                .subcategory(analysis.getSubcategory())
                .summary(analysis.getSummary())
                .severityLevel(analysis.getSeverityLevel())
                .urgencyLevel(analysis.getUrgencyLevel())
                .priorityScore(analysis.getPriorityScore())
                .priorityLevel(analysis.getPriorityLevel())
                .requiredExpertise(analysis.getRequiredExpertise())
                .possibleSolutions(analysis.getPossibleSolutions())
                .confidence(analysis.getConfidence())
                .createdAt(analysis.getCreatedAt())
                .updatedAt(analysis.getUpdatedAt())
                .build();
    }
}
