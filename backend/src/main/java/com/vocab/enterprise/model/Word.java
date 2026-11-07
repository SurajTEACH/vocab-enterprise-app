package com.vocab.enterprise.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "words")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    @JsonIgnore
    private Chapter chapter;

    @Column(nullable = false)
    private String word;

    private String phonetic;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String meaning;

    private String hindiMeaning;

    @Column(columnDefinition = "TEXT")
    private String exampleSentence;

    private String partOfSpeech;

    private String audioUrl;

    private String category;
}
