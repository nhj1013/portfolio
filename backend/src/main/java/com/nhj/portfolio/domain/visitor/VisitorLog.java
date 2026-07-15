package com.nhj.portfolio.domain.visitor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 방문 기록 엔티티.
 * (visitorId, visitDate) 유니크 제약으로 같은 브라우저는 하루 1번만 저장된다.
 * visitorId 는 첫 방문 시 발급하는 쿠키(UUID) 값.
 */
@Entity
@Table(name = "visitor_log",
        uniqueConstraints = @UniqueConstraint(name = "uk_visitor_date", columnNames = {"visitor_id", "visit_date"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class VisitorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visitor_id", nullable = false, length = 36, updatable = false)
    private String visitorId;

    @Column(name = "visit_date", nullable = false, updatable = false)
    private LocalDate visitDate;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public VisitorLog(String visitorId, LocalDate visitDate) {
        this.visitorId = visitorId;
        this.visitDate = visitDate;
    }
}
