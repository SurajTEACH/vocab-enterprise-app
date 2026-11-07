package com.vocab.enterprise.service;

import com.vocab.enterprise.config.JwtUtils;
import com.vocab.enterprise.dto.AuthDTOs.*;
import com.vocab.enterprise.model.User;
import com.vocab.enterprise.model.UserPermission;
import com.vocab.enterprise.repository.UserRepository;
import com.vocab.enterprise.repository.UserPermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsername() != null ? request.getUsername().trim() : "";
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByMobileNumber(identifier))
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new BadCredentialsException("Invalid email ID, mobile number or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email ID, mobile number or password");
        }

        // Special check for admin user
        if ("surajshah1509@gmail.com".equalsIgnoreCase(user.getEmail()) && user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.MANAGER) {
            user.setRole(User.Role.ADMIN);
            user = userRepository.save(user);
        }

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole().name());

        final User finalUser = user;
        UserPermission permission = userPermissionRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    String defaultStudentPerms = "{\"synonyms\":true,\"antonyms\":true,\"idioms\":true,\"rootWords\":true,\"oneWord\":true,\"dayWiseTest\":true,\"sectionalTest\":true,\"pyqQuestion\":true,\"questionSheet\":true}";
                    UserPermission perm = UserPermission.builder()
                            .userId(finalUser.getId())
                            .role(finalUser.getRole().name())
                            .studentPermissionsJson(defaultStudentPerms)
                            .crudPermissionsJson("{\"canCreateWord\":true,\"canEditWord\":true,\"canDeleteWord\":true,\"canManageUsers\":true}")
                            .build();
                    return userPermissionRepository.save(perm);
                });

        return AuthResponse.builder()
                .id(user.getId())
                .userId(user.getId())
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobileNumber(user.getMobileNumber())
                .profileImage(user.getProfileImage())
                .city(user.getCity())
                .targetExam(user.getTargetExam())
                .role(user.getRole().name())
                .streak(user.getCurrentStreak())
                .totalXp(user.getTotalXp())
                .studentPermissionsJson(permission.getStudentPermissionsJson())
                .crudPermissionsJson(permission.getCrudPermissionsJson())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered!");
        }

        User.Role role = User.Role.STUDENT;
        if ("surajshah1509@gmail.com".equalsIgnoreCase(request.getEmail()) || "MANAGER".equalsIgnoreCase(request.getRole()) || "ADMIN".equalsIgnoreCase(request.getRole()) || "STAFF".equalsIgnoreCase(request.getRole())) {
            role = "surajshah1509@gmail.com".equalsIgnoreCase(request.getEmail()) ? User.Role.ADMIN : User.Role.valueOf(request.getRole().toUpperCase());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .mobileNumber(request.getMobileNumber())
                .city(request.getCity())
                .targetExam(request.getTargetExam())
                .role(role)
                .currentStreak(1)
                .totalXp(50)
                .build();

        user = userRepository.save(user);

        String defaultStudentPerms = "{\"synonyms\":true,\"antonyms\":true,\"idioms\":true,\"rootWords\":true,\"oneWord\":true,\"dayWiseTest\":true,\"sectionalTest\":true,\"pyqQuestion\":true,\"questionSheet\":true}";
        UserPermission permission = UserPermission.builder()
                .userId(user.getId())
                .role(user.getRole().name())
                .studentPermissionsJson(defaultStudentPerms)
                .crudPermissionsJson("{\"canCreateWord\":true,\"canEditWord\":true,\"canDeleteWord\":true,\"canManageUsers\":true}")
                .build();
        permission = userPermissionRepository.save(permission);

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .id(user.getId())
                .userId(user.getId())
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobileNumber(user.getMobileNumber())
                .profileImage(user.getProfileImage())
                .city(user.getCity())
                .targetExam(user.getTargetExam())
                .role(user.getRole().name())
                .streak(user.getCurrentStreak())
                .totalXp(user.getTotalXp())
                .studentPermissionsJson(permission.getStudentPermissionsJson())
                .crudPermissionsJson(permission.getCrudPermissionsJson())
                .build();
    }
}

