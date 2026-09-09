package com.civicsolve.controller;

import com.civicsolve.dto.CreateProjectRequestDTO;
import com.civicsolve.dto.ProjectDTO;
import com.civicsolve.entity.Project;
import com.civicsolve.repository.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_UNIVERSITY', 'ROLE_ADMIN')")
    public ResponseEntity<?> createProject(@Valid @RequestBody CreateProjectRequestDTO request) {
        try {
            Project project = Project.builder()
                    .challengeId(request.getChallengeId())
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .objectives(request.getObjectives())
                    .budget(request.getBudget())
                    .status(Project.ProjectStatus.PROJECT_CREATED)
                    .build();

            Project savedProject = projectRepository.save(project);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(savedProject));
        } catch (Exception e) {
            log.error("Error creating project", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error creating project: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable String id) {
        try {
            Project project = projectRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            return ResponseEntity.ok(convertToDTO(project));
        } catch (Exception e) {
            log.error("Error fetching project", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllProjects() {
        try {
            List<Project> projects = projectRepository.findAll();
            List<ProjectDTO> dtos = projects.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching projects", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching projects");
        }
    }

    @GetMapping("/university/{universityId}")
    public ResponseEntity<?> getProjectsByUniversity(@PathVariable String universityId) {
        try {
            List<Project> projects = projectRepository.findByUniversityId(universityId);
            List<ProjectDTO> dtos = projects.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching projects by university", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching projects");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_UNIVERSITY', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateProject(@PathVariable String id, @RequestBody ProjectDTO request) {
        try {
            Project project = projectRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Project not found"));

            project.setProgressPercentage(request.getProgressPercentage());
            project.setStatus(Project.ProjectStatus.valueOf(request.getStatus()));

            Project updatedProject = projectRepository.save(project);
            return ResponseEntity.ok(convertToDTO(updatedProject));
        } catch (Exception e) {
            log.error("Error updating project", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error updating project");
        }
    }

    private ProjectDTO convertToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .challengeId(project.getChallengeId())
                .universityId(project.getUniversityId())
                .title(project.getTitle())
                .description(project.getDescription())
                .objectives(project.getObjectives())
                .industryId(project.getIndustryId())
                .progressPercentage(project.getProgressPercentage())
                .status(project.getStatus() != null ? project.getStatus().toString() : null)
                .startDate(project.getStartDate())
                .expectedEndDate(project.getExpectedEndDate())
                .actualEndDate(project.getActualEndDate())
                .budget(project.getBudget())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
