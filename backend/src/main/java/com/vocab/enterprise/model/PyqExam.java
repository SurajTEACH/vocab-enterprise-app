package com.vocab.enterprise.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pyq_exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PyqExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    private String countText;
}
