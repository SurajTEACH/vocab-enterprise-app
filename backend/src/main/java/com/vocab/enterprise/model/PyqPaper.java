package com.vocab.enterprise.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pyq_papers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PyqPaper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String examTitle;

    @Column(nullable = false)
    private String paperName;

    private String fileSize;

    private String fileType;

    private String addedDate;

    @Column(columnDefinition = "LONGTEXT")
    private String fileUrl;
}
