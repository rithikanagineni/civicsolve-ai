package com.civicsolve.repository;

import com.civicsolve.entity.ProjectProgressUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectProgressUpdateRepository extends JpaRepository<ProjectProgressUpdate, String> {
    List<ProjectProgressUpdate> findByProjectId(String projectId);
}
