package com.civicsolve.controller;

import com.civicsolve.dto.ChallengeMatchDTO;
import com.civicsolve.entity.ChallengeMatch;
import com.civicsolve.entity.User;
import com.civicsolve.repository.ChallengeMatchRepository;
import com.civicsolve.repository.UserRepository;
import com.civicsolve.service.ChallengeMatchingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChallengeMatchController {

    @Autowired
    private ChallengeMatchingService matchingService;

    @Autowired
    private ChallengeMatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/challenge/{challengeId}")
    public ResponseEntity<?> getMatchesForChallenge(@PathVariable String challengeId) {
        try {
            List<ChallengeMatch> matches = matchingService.getMatchesForChallenge(challengeId);
            List<ChallengeMatchDTO> dtos = matches.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching matches for challenge", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching matches");
        }
    }

    @GetMapping("/entity/{entityId}")
    public ResponseEntity<?> getMatchesForEntity(@PathVariable String entityId, @RequestParam String matchType) {
        try {
            ChallengeMatch.MatchType type = ChallengeMatch.MatchType.valueOf(matchType);
            List<ChallengeMatch> matches = matchingService.getMatchesForEntity(entityId, type);
            List<ChallengeMatchDTO> dtos = matches.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching matches for entity", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching matches");
        }
    }

    @PostMapping("/{matchId}/accept")
    @PreAuthorize("hasAnyRole('ROLE_UNIVERSITY', 'ROLE_INDUSTRY')")
    public ResponseEntity<?> acceptMatch(@PathVariable String matchId) {
        try {
            matchingService.acceptMatch(matchId);
            ChallengeMatch match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new RuntimeException("Match not found"));
            return ResponseEntity.ok(convertToDTO(match));
        } catch (Exception e) {
            log.error("Error accepting match", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error accepting match");
        }
    }

    @PostMapping("/{matchId}/reject")
    @PreAuthorize("hasAnyRole('ROLE_UNIVERSITY', 'ROLE_INDUSTRY')")
    public ResponseEntity<?> rejectMatch(@PathVariable String matchId) {
        try {
            matchingService.rejectMatch(matchId);
            ChallengeMatch match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new RuntimeException("Match not found"));
            return ResponseEntity.ok(convertToDTO(match));
        } catch (Exception e) {
            log.error("Error rejecting match", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error rejecting match");
        }
    }

    private ChallengeMatchDTO convertToDTO(ChallengeMatch match) {
        Optional<User> entity = userRepository.findById(match.getEntityId());
        return ChallengeMatchDTO.builder()
                .id(match.getId())
                .challengeId(match.getChallengeId())
                .entityId(match.getEntityId())
                .matchType(match.getMatchType() != null ? match.getMatchType().toString() : null)
                .matchScore(match.getMatchScore())
                .matchReasons(match.getMatchReasons())
                .status(match.getStatus() != null ? match.getStatus().toString() : null)
                .acceptedAt(match.getAcceptedAt())
                .createdAt(match.getCreatedAt())
                .updatedAt(match.getUpdatedAt())
                .build();
    }
}
