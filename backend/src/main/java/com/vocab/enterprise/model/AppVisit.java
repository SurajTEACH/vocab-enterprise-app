package com.vocab.enterprise.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_visits", indexes = {
    @Index(name = "idx_visitor_date", columnList = "visitor_id, visit_date"),
    @Index(name = "idx_user_date", columnList = "user_id, visit_date"),
    @Index(name = "idx_visit_date", columnList = "visit_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visitor_id", length = 100, nullable = false)
    private String visitorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "visited_at", nullable = false)
    private LocalDateTime visitedAt;

    private String ipAddress;

    private String userAgent;

    private String platform;

    @PrePersist
    protected void onCreate() {
        if (visitedAt == null) {
            visitedAt = LocalDateTime.now();
        }
        if (visitDate == null) {
            visitDate = visitedAt.toLocalDate();
        }
    }
}

