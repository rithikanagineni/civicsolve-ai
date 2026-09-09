package com.civicsolve.service;

import com.civicsolve.entity.Challenge;
import com.civicsolve.repository.ChallengeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DuplicateDetectionService {

    @Autowired
    private ChallengeRepository challengeRepository;

    public List<Challenge> findPotentialDuplicates(Challenge challenge) {
        List<Challenge> allChallenges = challengeRepository.findAll();

        return allChallenges.stream()
                .filter(c -> !c.getId().equals(challenge.getId()))
                .filter(c -> calculateSimilarity(challenge, c) > 0.6)
                .sorted((c1, c2) -> Double.compare(
                        calculateSimilarity(challenge, c2),
                        calculateSimilarity(challenge, c1)
                ))
                .collect(Collectors.toList());
    }

    private Double calculateSimilarity(Challenge c1, Challenge c2) {
        Double similarity = 0.0;

        // Title similarity (weighted heavily)
        similarity += calculateStringSimilarity(c1.getTitle(), c2.getTitle()) * 0.4;

        // Category match
        if (c1.getCategory() != null && c1.getCategory().equalsIgnoreCase(c2.getCategory())) {
            similarity += 0.25;
        }

        // Location match
        if (c1.getLocation() != null && c1.getLocation().equalsIgnoreCase(c2.getLocation())) {
            similarity += 0.2;
        }

        // Description similarity
        similarity += calculateStringSimilarity(c1.getDescription(), c2.getDescription()) * 0.15;

        return Math.min(similarity, 1.0);
    }

    private Double calculateStringSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;

        s1 = s1.toLowerCase().trim();
        s2 = s2.toLowerCase().trim();

        if (s1.equals(s2)) return 1.0;

        // Simple Levenshtein distance approximation
        int maxLength = Math.max(s1.length(), s2.length());
        if (maxLength == 0) return 1.0;

        int distance = levenshteinDistance(s1, s2);
        return 1.0 - ((double) distance / maxLength);
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], Math.min(dp[i][j - 1], dp[i - 1][j - 1]));
                }
            }
        }

        return dp[s1.length()][s2.length()];
    }
}
