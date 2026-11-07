package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByMobileNumber(String mobileNumber);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    Boolean existsByMobileNumber(String mobileNumber);
}
