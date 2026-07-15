package com.nhj.portfolio.domain.visitor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {

    boolean existsByVisitorIdAndVisitDate(String visitorId, LocalDate visitDate);

    long countByVisitDate(LocalDate visitDate);
}
