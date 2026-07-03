package com.nhj.portfolio.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record SignupRequest(
            @NotBlank(message = "아이디를 입력해 주세요.")
            @Pattern(regexp = "^[a-zA-Z0-9_]{4,20}$", message = "아이디는 영문/숫자/_ 4~20자여야 합니다.")
            String username,

            @NotBlank(message = "비밀번호를 입력해 주세요.")
            @Size(min = 8, max = 64, message = "비밀번호는 8자 이상이어야 합니다.")
            String password,

            @NotBlank(message = "닉네임을 입력해 주세요.")
            @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
            String nickname
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "아이디를 입력해 주세요.")
            String username,

            @NotBlank(message = "비밀번호를 입력해 주세요.")
            String password
    ) {
    }

    public record LoginResponse(String accessToken, Long memberId, String nickname) {
    }
}
