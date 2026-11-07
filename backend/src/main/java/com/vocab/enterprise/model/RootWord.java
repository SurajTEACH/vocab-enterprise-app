package com.vocab.enterprise.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "root_words")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RootWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    @JsonIgnore
    private Chapter chapter;

    @Column(nullable = false)
    private String rootWord; // e.g. "ac, acr"

    @Column(columnDefinition = "TEXT")
    private String meaningJson; // JSON string for meanings with Hindi (e.g. sharp (तेज), bitter (कड़वा))

    @Column(columnDefinition = "TEXT")
    private String examplesJson; // JSON string for numbered examples with English & Hindi meanings
}
