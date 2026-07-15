package com.nhj.portfolio.domain.visitor;

import com.nhj.portfolio.domain.visitor.dto.VisitorDtos.VisitorCountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class VisitorService {

    // 서버(오라클 도쿄 VM) 타임존과 무관하게 한국 날짜 기준으로 집계
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final VisitorLogRepository visitorLogRepository;

    public void visit(String visitorId) {
        LocalDate today = LocalDate.now(KST);
        if (visitorLogRepository.existsByVisitorIdAndVisitDate(visitorId, today)) {
            return;
        }
        try {
            visitorLogRepository.save(new VisitorLog(visitorId, today));
        } catch (DataIntegrityViolationException e) {
            // 동시 요청이 먼저 저장한 경우 (유니크 제약 위반) — 하루 1회 카운트이므로 무시
        }
    }

    public VisitorCountResponse count() {
        return new VisitorCountResponse(
                visitorLogRepository.countByVisitDate(LocalDate.now(KST)),
                visitorLogRepository.count()
        );
    }
}
