package com.vocab.enterprise.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "homonyms_homophones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomonymHomophone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    @JsonIgnore
    private Chapter chapter;

    @Column(nullable = false)
    private String word;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String meaning;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String hindiMeaning;

    private String partOfSpeech;

    @Column(columnDefinition = "TEXT")
    private String similarWordsJson; // JSON string for similar words pairs (Word & Hindi)
}
