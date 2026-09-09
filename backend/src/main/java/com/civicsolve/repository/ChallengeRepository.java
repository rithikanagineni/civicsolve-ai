package com.civicsolve.repository;

import com.civicsolve.entity.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, String> {
    List<Challenge> findByCitizenId(String citizenId);
    Optional<Challenge> findByComplaintCode(String complaintCode);
    List<Challenge> findByCategory(String category);
    List<Challenge> findBySeverity(Challenge.SeverityLevel severity);
    List<Challenge> findByStatus(Challenge.ChallengeStatus status);
}
