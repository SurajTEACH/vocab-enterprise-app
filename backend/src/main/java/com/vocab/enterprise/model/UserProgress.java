package com.vocab.enterprise.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @Builder.Default
    private Boolean isMastered = false;

    @Builder.Default
    private Integer reviewCount = 0;

    private LocalDateTime lastReviewedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        lastReviewedAt = LocalDateTime.now();
    }
}
