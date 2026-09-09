package com.civicsolve.controller;

import com.civicsolve.ai.AIAnalysisService;
import com.civicsolve.dto.*;
import com.civicsolve.entity.Challenge;
import com.civicsolve.entity.ChallengeAIAnalysis;
import com.civicsolve.repository.ChallengeAIAnalysisRepository;
import com.civicsolve.repository.ChallengeRepository;
import com.civicsolve.service.ChallengeMatchingService;
import com.civicsolve.service.DuplicateDetectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/challenges")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChallengeController {

    @Autowired
    private ChallengeRepository challengeRepository;

    @Autowired
    private ChallengeAIAnalysisRepository aiAnalysisRepository;

    @Autowired
    private AIAnalysisService aiAnalysisService;

    @Autowired
    private ChallengeMatchingService matchingService;

    @Autowired
    private DuplicateDetectionService duplicateDetectionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_CITIZEN')")
    public ResponseEntity<?> createChallenge(@Valid @RequestBody CreateChallengeRequestDTO request) {
        try {
            Challenge challenge = Challenge.builder()
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .category(request.getCategory())
                    .subcategory(request.getSubcategory())
                    .location(request.getLocation())
                    .landmark(request.getLandmark())
                    .severity(Challenge.SeverityLevel.valueOf(request.getSeverity() != null ? request.getSeverity() : "MEDIUM"))
                    .duration(request.getDuration())
                    .peopleAffected(request.getPeopleAffected())
                    .imageUrl(request.getImageUrl())
                    .inputMethod(request.getInputMethod())
                    .originalLanguage(request.getOriginalLanguage())
                    .status(Challenge.ChallengeStatus.REPORTED)
                    .build();

            Challenge savedChallenge = challengeRepository.save(challenge);

            // Check for duplicates
            List<Challenge> potentialDuplicates = duplicateDetectionService.findPotentialDuplicates(savedChallenge);
            if (!potentialDuplicates.isEmpty()) {
                log.info("Found {} potential duplicate challenges for challenge {}", potentialDuplicates.size(), savedChallenge.getId());
            }

            // Perform AI analysis
            ChallengeAIAnalysisDTO analysis = aiAnalysisService.analyzeChallengeWithAI(
                    savedChallenge.getTitle(),
                    savedChallenge.getDescription(),
                    savedChallenge.getLocation()
            );

            ChallengeAIAnalysis aiAnalysis = new ChallengeAIAnalysis();
            aiAnalysis.setChallengeId(savedChallenge.getId());
            aiAnalysis.setCategory(analysis.getCategory());
            aiAnalysis.setSubcategory(analysis.getSubcategory());
            aiAnalysis.setSummary(analysis.getSummary());
            aiAnalysis.setSeverityLevel(analysis.getSeverityLevel());
            aiAnalysis.setUrgencyLevel(analysis.getUrgencyLevel());
            aiAnalysis.setPriorityScore(analysis.getPriorityScore());
            aiAnalysis.setPriorityLevel(analysis.getPriorityLevel());
            aiAnalysis.setRequiredExpertise(analysis.getRequiredExpertise());
            aiAnalysis.setPossibleSolutions(analysis.getPossibleSolutions());
            aiAnalysis.setConfidence(analysis.getConfidence());

            aiAnalysisRepository.save(aiAnalysis);
            savedChallenge.setStatus(Challenge.ChallengeStatus.AI_ANALYZED);
            challengeRepository.save(savedChallenge);

            // Find and create matches
            matchingService.findAndMatchUniversities(savedChallenge.getId());
            matchingService.findAndMatchIndustries(savedChallenge.getId());
            savedChallenge.setStatus(Challenge.ChallengeStatus.PRIORITIZED);
            challengeRepository.save(savedChallenge);

            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(savedChallenge));
        } catch (Exception e) {
            log.error("Error creating challenge", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error creating challenge: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getChallenge(@PathVariable String id) {
        try {
            Challenge challenge = challengeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Challenge not found"));
            return ResponseEntity.ok(convertToDTO(challenge));
        } catch (Exception e) {
            log.error("Error fetching challenge", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Challenge not found");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllChallenges() {
        try {
            List<Challenge> challenges = challengeRepository.findAll();
            List<ChallengeDTO> dtos = challenges.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching challenges", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching challenges");
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<?> getChallengesByCategory(@PathVariable String category) {
        try {
            List<Challenge> challenges = challengeRepository.findByCategory(category);
            List<ChallengeDTO> dtos = challenges.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching challenges by category", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching challenges");
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getChallengesByStatus(@PathVariable String status) {
        try {
            List<Challenge> challenges = challengeRepository.findByStatus(Challenge.ChallengeStatus.valueOf(status));
            List<ChallengeDTO> dtos = challenges.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching challenges by status", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching challenges");
        }
    }

    private ChallengeDTO convertToDTO(Challenge challenge) {
        return ChallengeDTO.builder()
                .id(challenge.getId())
                .complaintCode(challenge.getComplaintCode())
                .citizenId(challenge.getCitizenId())
                .title(challenge.getTitle())
                .description(challenge.getDescription())
                .category(challenge.getCategory())
                .subcategory(challenge.getSubcategory())
                .location(challenge.getLocation())
                .landmark(challenge.getLandmark())
                .severity(challenge.getSeverity() != null ? challenge.getSeverity().toString() : null)
                .duration(challenge.getDuration())
                .peopleAffected(challenge.getPeopleAffected())
                .imageUrl(challenge.getImageUrl())
                .inputMethod(challenge.getInputMethod())
                .originalLanguage(challenge.getOriginalLanguage())
                .status(challenge.getStatus() != null ? challenge.getStatus().toString() : null)
                .communityVotes(challenge.getCommunityVotes())
                .createdAt(challenge.getCreatedAt())
                .updatedAt(challenge.getUpdatedAt())
                .build();
    }
}
