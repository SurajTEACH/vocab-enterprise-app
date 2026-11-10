package com.vocab.enterprise.controller;

import com.vocab.enterprise.dto.VocabDTOs.*;
import com.vocab.enterprise.model.User;
import com.vocab.enterprise.service.DailyChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/daily", "/daily"})
@RequiredArgsConstructor
public class DailyChallengeController {

    private final DailyChallengeService dailyChallengeService;

    @GetMapping("/challenge")
    public ResponseEntity<DailyChallengeResponse> getDailyChallenge(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false, defaultValue = "1") Integer day) {
        return ResponseEntity.ok(dailyChallengeService.getDailyChallenge(user, day));
    }

    @PostMapping("/submit-test")
    public ResponseEntity<TestResultResponse> submitTest(
            @AuthenticationPrincipal User user,
            @RequestBody TestSubmissionRequest request) {
        return ResponseEntity.ok(dailyChallengeService.submitTest(user, request));
    }
}
