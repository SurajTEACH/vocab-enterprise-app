package com.vocab.enterprise.controller;

import com.vocab.enterprise.dto.AnalyticsDTOs.*;
import com.vocab.enterprise.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/analytics", "/api/manager/analytics"})
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * POST /api/analytics/visit
     * Records a real app visit with enterprise deduplication.
     * Prevents duplicate count on reload/remount.
     */
    @PostMapping("/visit")
    public ResponseEntity<AnalyticsOverviewResponse> recordVisit(
            @RequestBody VisitRecordRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(analyticsService.recordVisit(request, httpRequest));
    }

    /**
     * GET /api/analytics/overview
     * Returns real-time unique visitors, total visits, and active students.
     */
    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewResponse> getOverview() {
        return ResponseEntity.ok(analyticsService.getOverview());
    }

    /**
     * GET /api/analytics/monthly-usage?year=2026&month=11
     * Returns full daily active usage for the requested month with peak day and lowest day.
     */
    @GetMapping("/monthly-usage")
    public ResponseEntity<MonthlyUsageResponse> getMonthlyUsage(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(analyticsService.getMonthlyUsage(year, month));
    }
}

