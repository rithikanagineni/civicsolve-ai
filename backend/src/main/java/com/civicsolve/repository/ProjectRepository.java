package com.civicsolve.repository;

import com.civicsolve.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {
    Optional<Project> findByChallengeId(String challengeId);
    List<Project> findByUniversityId(String universityId);
    List<Project> findByIndustryId(String industryId);
    List<Project> findByStatus(Project.ProjectStatus status);
}
