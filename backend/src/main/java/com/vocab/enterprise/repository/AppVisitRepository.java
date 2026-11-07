package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.AppVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppVisitRepository extends JpaRepository<AppVisit, Long> {

    boolean existsByVisitorIdAndVisitDate(String visitorId, LocalDate visitDate);

    boolean existsByUserIdAndVisitDate(Long userId, LocalDate visitDate);

    Optional<AppVisit> findFirstByVisitorIdAndVisitDate(String visitorId, LocalDate visitDate);

    Optional<AppVisit> findFirstByUserIdAndVisitDate(Long userId, LocalDate visitDate);

    @Query("SELECT COUNT(DISTINCT v.visitorId) FROM AppVisit v")
    long countDistinctVisitorId();

    long countByVisitDate(LocalDate visitDate);

    List<AppVisit> findByVisitDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT COUNT(DISTINCT v.visitorId) FROM AppVisit v WHERE v.visitDate = :date")
    long countUniqueVisitorsByDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(DISTINCT v.user.id) FROM AppVisit v WHERE v.user IS NOT NULL AND v.visitDate = :date")
    long countActiveStudentsByDate(@Param("date") LocalDate date);
}

