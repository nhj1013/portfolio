package com.nhj.portfolio.domain.visitor;

import com.nhj.portfolio.domain.visitor.dto.VisitorDtos.VisitorCountResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;
import java.util.regex.Pattern;

@Tag(name = "Visitor", description = "방문자 수 카운트")
@RestController
@RequestMapping("/api/v1/visitors")
@RequiredArgsConstructor
public class VisitorController {

    private static final String COOKIE_NAME = "visitorId";
    // 클라이언트가 임의 값을 보내면 새로 발급하기 위한 UUID 형식 검증
    private static final Pattern UUID_PATTERN =
            Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");

    private final VisitorService visitorService;

    @Operation(summary = "방문 기록 (쿠키 기준 하루 1회 카운트) 후 방문자 수 반환")
    @PostMapping("/visit")
    public VisitorCountResponse visit(@CookieValue(name = COOKIE_NAME, required = false) String visitorId,
                                      HttpServletResponse response) {
        if (visitorId == null || !UUID_PATTERN.matcher(visitorId).matches()) {
            visitorId = UUID.randomUUID().toString();
            ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, visitorId)
                    .httpOnly(true)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(Duration.ofDays(365))
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }
        visitorService.visit(visitorId);
        return visitorService.count();
    }

    @Operation(summary = "방문자 수 조회 (오늘 / 누적)")
    @GetMapping("/count")
    public VisitorCountResponse count() {
        return visitorService.count();
    }
}
