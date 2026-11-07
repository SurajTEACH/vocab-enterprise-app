package com.vocab.enterprise.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private String role; // STUDENT, MANAGER, ADMIN, STAFF

    @Column(name = "student_permissions_json", columnDefinition = "TEXT")
    private String studentPermissionsJson;

    @Column(name = "crud_permissions_json", columnDefinition = "TEXT")
    private String crudPermissionsJson;
}
