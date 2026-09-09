package com.civicsolve.repository;

import com.civicsolve.entity.ChallengeMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChallengeMatchRepository extends JpaRepository<ChallengeMatch, String> {
    List<ChallengeMatch> findByChallengeId(String challengeId);
    List<ChallengeMatch> findByEntityId(String entityId);
    List<ChallengeMatch> findByEntityIdAndMatchType(String entityId, ChallengeMatch.MatchType matchType);
    List<ChallengeMatch> findByChallengeIdAndMatchType(String challengeId, ChallengeMatch.MatchType matchType);
    List<ChallengeMatch> findByStatus(ChallengeMatch.MatchStatus status);
}
