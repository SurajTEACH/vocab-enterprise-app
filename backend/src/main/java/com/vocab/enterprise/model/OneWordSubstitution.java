package com.vocab.enterprise.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "one_word_substitutions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OneWordSubstitution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    @JsonIgnore
    private Chapter chapter;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String phrase;

    @Column(nullable = false)
    private String oneWord;

    private String partOfSpeech;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String hindiMeaning;
}
