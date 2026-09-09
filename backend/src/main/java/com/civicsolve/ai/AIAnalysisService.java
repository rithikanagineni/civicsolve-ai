package com.civicsolve.ai;

import com.civicsolve.dto.ChallengeAIAnalysisDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AIAnalysisService {

    @Value("${ai.api-key}")
    private String aiApiKey;

    @Value("${ai.provider}")
    private String aiProvider;

    @Value("${ai.model}")
    private String aiModel;

    @Value("${ai.enabled}")
    private Boolean aiEnabled;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChallengeAIAnalysisDTO analyzeChallengeWithAI(String title, String description, String location) {
        if (!aiEnabled) {
            return analyzeChallengeWithFallback(title, description, location);
        }

        try {
            // Call AI API
            String prompt = buildAnalysisPrompt(title, description, location);
            String aiResponse = callAIAPI(prompt);
            
            return parseAIResponse(aiResponse);
        } catch (Exception e) {
            log.error("Error calling AI API, falling back to deterministic analysis", e);
            return analyzeChallengeWithFallback(title, description, location);
        }
    }

    private String buildAnalysisPrompt(String title, String description, String location) {
        return String.format(
            "Analyze this civic problem and provide a JSON response with the following fields: " +
            "category, subcategory, summary (max 200 words), severityLevel (LOW/MEDIUM/HIGH/CRITICAL), " +
            "urgencyLevel, priorityScore (0-100), priorityLevel, requiredExpertise (comma-separated), " +
            "possibleSolutions (bullet points), confidence (0-1).\n\n" +
            "Problem Title: %s\n" +
            "Description: %s\n" +
            "Location: %s",
            title, description, location
        );
    }

    private String callAIAPI(String prompt) {
        // Placeholder for actual AI API call
        // In production, this would call OpenAI, Claude, or other AI service
        log.info("Calling AI API with prompt: {}", prompt);
        return "{\"category\": \"placeholder\"}";
    }

    private ChallengeAIAnalysisDTO parseAIResponse(String aiResponse) {
        try {
            Map<String, Object> responseMap = objectMapper.readValue(aiResponse, Map.class);
            
            return ChallengeAIAnalysisDTO.builder()
                    .category((String) responseMap.getOrDefault("category", "Other"))
                    .subcategory((String) responseMap.getOrDefault("subcategory", "General"))
                    .summary((String) responseMap.getOrDefault("summary", ""))
                    .severityLevel((String) responseMap.getOrDefault("severityLevel", "MEDIUM"))
                    .urgencyLevel((String) responseMap.getOrDefault("urgencyLevel", "MEDIUM"))
                    .priorityScore(((Number) responseMap.getOrDefault("priorityScore", 50)).intValue())
                    .priorityLevel((String) responseMap.getOrDefault("priorityLevel", "MEDIUM"))
                    .requiredExpertise((String) responseMap.getOrDefault("requiredExpertise", ""))
                    .possibleSolutions((String) responseMap.getOrDefault("possibleSolutions", ""))
                    .confidence(((Number) responseMap.getOrDefault("confidence", 0.8)).doubleValue())
                    .build();
        } catch (Exception e) {
            log.error("Error parsing AI response", e);
            return analyzeChallengeWithFallback("", "", "");
        }
    }

    public ChallengeAIAnalysisDTO analyzeChallengeWithFallback(String title, String description, String location) {
        // Deterministic analysis based on keywords
        String category = determineCategoryFromKeywords(title, description);
        Integer priorityScore = calculatePriorityScore(description, category);
        String severityLevel = determineSeverityLevel(description);

        return ChallengeAIAnalysisDTO.builder()
                .category(category)
                .subcategory(determineSubcategory(category))
                .summary(generateSummary(title, description))
                .severityLevel(severityLevel)
                .urgencyLevel("MEDIUM")
                .priorityScore(priorityScore)
                .priorityLevel(priorityScore > 70 ? "HIGH" : priorityScore > 40 ? "MEDIUM" : "LOW")
                .requiredExpertise(getExpertiseForCategory(category))
                .possibleSolutions(getSolutionsForCategory(category))
                .confidence(0.7)
                .build();
    }

    private String determineCategoryFromKeywords(String title, String description) {
        String combined = (title + " " + description).toLowerCase();

        if (combined.contains("water") || combined.contains("drainage") || combined.contains("sewage")) {
            return "Water & Sanitation";
        } else if (combined.contains("road") || combined.contains("pothole") || combined.contains("traffic")) {
            return "Transportation & Infrastructure";
        } else if (combined.contains("electricity") || combined.contains("power") || combined.contains("street light")) {
            return "Energy";
        } else if (combined.contains("waste") || combined.contains("garbage") || combined.contains("trash")) {
            return "Waste Management";
        } else if (combined.contains("school") || combined.contains("education") || combined.contains("college")) {
            return "Education";
        } else if (combined.contains("health") || combined.contains("hospital") || combined.contains("medical")) {
            return "Health & Healthcare";
        } else if (combined.contains("pollution") || combined.contains("air") || combined.contains("noise")) {
            return "Environment & Climate";
        } else if (combined.contains("park") || combined.contains("green") || combined.contains("tree")) {
            return "Parks & Recreation";
        }
        return "Other";
    }

    private String determineSubcategory(String category) {
        return switch (category) {
            case "Water & Sanitation" -> "Water Supply & Drainage";
            case "Transportation & Infrastructure" -> "Road Maintenance";
            case "Energy" -> "Public Lighting";
            case "Waste Management" -> "Solid Waste";
            case "Education" -> "Infrastructure";
            case "Health & Healthcare" -> "Public Health";
            case "Environment & Climate" -> "Air Quality";
            case "Parks & Recreation" -> "Public Spaces";
            default -> "General";
        };
    }

    private Integer calculatePriorityScore(String description, String category) {
        int score = 50;

        if (description.length() > 200) score += 10;
        if (description.toLowerCase().contains("urgent") || description.toLowerCase().contains("critical")) score += 20;
        if (description.toLowerCase().contains("health") || description.toLowerCase().contains("safety")) score += 15;
        if (description.toLowerCase().contains("child") || description.toLowerCase().contains("elderly")) score += 10;

        return Math.min(score, 100);
    }

    private String determineSeverityLevel(String description) {
        String lower = description.toLowerCase();
        if (lower.contains("critical") || lower.contains("emergency") || lower.contains("immediate")) {
            return "CRITICAL";
        } else if (lower.contains("urgent") || lower.contains("severe")) {
            return "HIGH";
        } else if (lower.contains("important") || lower.contains("significant")) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private String generateSummary(String title, String description) {
        String desc = description.length() > 150 ? description.substring(0, 150) + "..." : description;
        return "Issue: " + title + ". Details: " + desc;
    }

    private String getExpertiseForCategory(String category) {
        return switch (category) {
            case "Water & Sanitation" -> "Civil Engineering, Environmental Engineering, Water Management";
            case "Transportation & Infrastructure" -> "Civil Engineering, Transportation Planning, Urban Planning";
            case "Energy" -> "Electrical Engineering, Power Systems, Renewable Energy";
            case "Waste Management" -> "Environmental Engineering, Waste Management, Public Health";
            case "Education" -> "Education, Infrastructure Planning, Architecture";
            case "Health & Healthcare" -> "Public Health, Medical Science, Health Policy";
            case "Environment & Climate" -> "Environmental Science, Climate Science, Sustainability";
            case "Parks & Recreation" -> "Urban Planning, Landscape Architecture, Community Development";
            default -> "General Engineering, Project Management";
        };
    }

    private String getSolutionsForCategory(String category) {
        return switch (category) {
            case "Water & Sanitation" -> "• Repair water pipes and drainage systems\n• Install water treatment facilities\n• Improve sanitation infrastructure";
            case "Transportation & Infrastructure" -> "• Repair roads and fill potholes\n• Improve traffic management\n• Enhance public transportation";
            case "Energy" -> "• Install/repair street lighting\n• Upgrade electrical infrastructure\n• Implement renewable energy solutions";
            case "Waste Management" -> "• Establish waste collection points\n• Implement recycling programs\n• Improve dumping site management";
            case "Education" -> "• Repair school buildings\n• Improve educational facilities\n• Provide necessary resources";
            case "Health & Healthcare" -> "• Improve healthcare facilities\n• Provide medical equipment\n• Enhance public health services";
            case "Environment & Climate" -> "• Reduce pollution sources\n• Plant trees and green spaces\n• Implement environmental policies";
            case "Parks & Recreation" -> "• Develop public parks\n• Maintain green spaces\n• Create recreational facilities";
            default -> "• Conduct detailed assessment\n• Plan implementation strategy\n• Execute with proper monitoring";
        };
    }
}
