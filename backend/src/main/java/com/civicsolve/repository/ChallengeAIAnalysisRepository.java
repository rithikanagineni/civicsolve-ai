package com.civicsolve.repository;

import com.civicsolve.entity.ChallengeAIAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChallengeAIAnalysisRepository extends JpaRepository<ChallengeAIAnalysis, String> {
    Optional<ChallengeAIAnalysis> findByChallengeId(String challengeId);
}
