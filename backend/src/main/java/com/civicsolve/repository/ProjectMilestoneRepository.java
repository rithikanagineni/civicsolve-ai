package com.civicsolve.repository;

import com.civicsolve.entity.ProjectMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, String> {
    List<ProjectMilestone> findByProjectId(String projectId);
    List<ProjectMilestone> findByProjectIdOrderBySequenceOrder(String projectId);
}
