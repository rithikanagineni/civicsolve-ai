package com.civicsolve.repository;

import com.civicsolve.entity.CitizenSatisfaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CitizenSatisfactionRepository extends JpaRepository<CitizenSatisfaction, String> {
    Optional<CitizenSatisfaction> findByChallengeIdAndCitizenId(String challengeId, String citizenId);
    List<CitizenSatisfaction> findByProjectId(String projectId);
    List<CitizenSatisfaction> findByCitizenId(String citizenId);
}
