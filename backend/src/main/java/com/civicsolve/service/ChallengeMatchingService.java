package com.civicsolve.service;

import com.civicsolve.dto.ChallengeDTO;
import com.civicsolve.entity.Challenge;
import com.civicsolve.entity.ChallengeMatch;
import com.civicsolve.entity.User;
import com.civicsolve.repository.ChallengeMatchRepository;
import com.civicsolve.repository.ChallengeRepository;
import com.civicsolve.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChallengeMatchingService {

    @Autowired
    private ChallengeRepository challengeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChallengeMatchRepository challengeMatchRepository;

    public void findAndMatchUniversities(String challengeId) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        List<User> universities = userRepository.findByRole(User.UserRole.ROLE_UNIVERSITY);

        for (User university : universities) {
            Double matchScore = calculateMatchScore(challenge, university);
            if (matchScore > 0.5) {
                createMatch(challenge, university, ChallengeMatch.MatchType.UNIVERSITY, matchScore);
            }
        }
    }

    public void findAndMatchIndustries(String challengeId) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        List<User> industries = userRepository.findByRole(User.UserRole.ROLE_INDUSTRY);

        for (User industry : industries) {
            Double matchScore = calculateMatchScore(challenge, industry);
            if (matchScore > 0.4) {
                createMatch(challenge, industry, ChallengeMatch.MatchType.INDUSTRY, matchScore);
            }
        }
    }

    private Double calculateMatchScore(Challenge challenge, User entity) {
        Double score = 0.0;

        // Category match
        if (entity.getExpertiseAreas() != null && entity.getExpertiseAreas().toLowerCase()
                .contains(challenge.getCategory().toLowerCase())) {
            score += 0.4;
        }

        // Location match
        if (entity.getCity() != null && entity.getCity().equalsIgnoreCase(challenge.getCity())) {
            score += 0.3;
        } else if (entity.getState() != null && entity.getState().equalsIgnoreCase(challenge.getState())) {
            score += 0.15;
        }

        // Organization type match (universities should focus on educational challenges, etc.)
        if (entity.getRole() == User.UserRole.ROLE_UNIVERSITY &&
                (challenge.getCategory().contains("Education") || challenge.getCategory().contains("Research"))) {
            score += 0.2;
        }

        // Active status
        if (entity.getActive()) {
            score += 0.1;
        }

        // Prevent negative scores
        return Math.max(0.0, Math.min(1.0, score));
    }

    private void createMatch(Challenge challenge, User entity, ChallengeMatch.MatchType matchType, Double matchScore) {
        // Check if match already exists
        List<ChallengeMatch> existingMatches = challengeMatchRepository.findByChallengeIdAndMatchType(
                challenge.getId(), matchType);
        boolean alreadyExists = existingMatches.stream()
                .anyMatch(m -> m.getEntityId().equals(entity.getId()));

        if (!alreadyExists) {
            ChallengeMatch match = ChallengeMatch.builder()
                    .challengeId(challenge.getId())
                    .entityId(entity.getId())
                    .matchType(matchType)
                    .matchScore(matchScore)
                    .matchReasons(generateMatchReasons(challenge, entity))
                    .status(ChallengeMatch.MatchStatus.PENDING)
                    .build();

            challengeMatchRepository.save(match);
            log.info("Created {} match for challenge {} with entity {}", matchType, challenge.getId(), entity.getId());
        }
    }

    private String generateMatchReasons(Challenge challenge, User entity) {
        List<String> reasons = new ArrayList<>();

        if (entity.getExpertiseAreas() != null && entity.getExpertiseAreas().toLowerCase()
                .contains(challenge.getCategory().toLowerCase())) {
            reasons.add("Expertise match in " + challenge.getCategory());
        }

        if (entity.getCity() != null && entity.getCity().equalsIgnoreCase(challenge.getCity())) {
            reasons.add("Same city location");
        } else if (entity.getState() != null && entity.getState().equalsIgnoreCase(challenge.getState())) {
            reasons.add("Same state/region");
        }

        if (entity.getRole() == User.UserRole.ROLE_UNIVERSITY) {
            reasons.add("University with relevant research capabilities");
        } else if (entity.getRole() == User.UserRole.ROLE_INDUSTRY) {
            reasons.add("Industry partner for resource/technology support");
        }

        return String.join("; ", reasons);
    }

    public List<ChallengeMatch> getMatchesForChallenge(String challengeId) {
        return challengeMatchRepository.findByChallengeId(challengeId);
    }

    public List<ChallengeMatch> getMatchesForEntity(String entityId, ChallengeMatch.MatchType matchType) {
        return challengeMatchRepository.findByEntityIdAndMatchType(entityId, matchType);
    }

    public void acceptMatch(String matchId) {
        ChallengeMatch match = challengeMatchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setStatus(ChallengeMatch.MatchStatus.ACCEPTED);
        challengeMatchRepository.save(match);

        // Update challenge status
        Challenge challenge = challengeRepository.findById(match.getChallengeId())
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        if (match.getMatchType() == ChallengeMatch.MatchType.UNIVERSITY) {
            challenge.setStatus(Challenge.ChallengeStatus.ACCEPTED);
        }
        challengeRepository.save(challenge);
    }

    public void rejectMatch(String matchId) {
        ChallengeMatch match = challengeMatchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setStatus(ChallengeMatch.MatchStatus.REJECTED);
        challengeMatchRepository.save(match);
    }
}
