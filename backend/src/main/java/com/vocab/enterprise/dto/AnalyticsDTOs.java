package com.vocab.enterprise.dto;

import lombok.*;

import java.util.List;

public class AnalyticsDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VisitRecordRequest {
        private String visitorId;
        private Long userId;
        private String platform;
        private String userAgent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnalyticsOverviewResponse {
        private long totalUniqueVisitors;
        private long totalVisits;
        private long todayVisits;
        private long activeStudentsNow;
        private long totalStudents;
        private boolean isNewVisitRecorded;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyUsageResponse {
        private int year;
        private int month;
        private String monthName;
        private int totalDays;
        private long totalVisits;
        private long totalActiveStudents;
        private long totalTestsCompleted;
        private DayUsageDto peakDay;
        private DayUsageDto lowestDay;
        private double averageDailyUsage;
        private List<DayUsageDto> days;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayUsageDto {
        private int day;
        private String date; // "2026-11-04"
        private String dayOfWeek; // "Mon", "Tue", etc.
        private long activeStudents;
        private long visits;
        private long testsCompleted;
        private long totalActivity;
        private boolean isPeak;
        private boolean isLowest;
        private boolean isToday;
        private boolean isFuture;
    }
}

