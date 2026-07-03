package com.nhj.portfolio.domain.member;

import com.nhj.portfolio.domain.member.dto.AuthDtos.LoginRequest;
import com.nhj.portfolio.domain.member.dto.AuthDtos.LoginResponse;
import com.nhj.portfolio.domain.member.dto.AuthDtos.SignupRequest;
import com.nhj.portfolio.global.exception.ApiException;
import com.nhj.portfolio.global.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Transactional
    public LoginResponse signup(SignupRequest request) {
        if (memberRepository.existsByUsername(request.username())) {
            throw ApiException.conflict("이미 사용 중인 아이디입니다.");
        }
        if (memberRepository.existsByNickname(request.nickname())) {
            throw ApiException.conflict("이미 사용 중인 닉네임입니다.");
        }

        Member member = memberRepository.save(Member.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .build());

        return issueToken(member);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Member member = memberRepository.findByUsername(request.username())
                .orElseThrow(() -> ApiException.unauthorized("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw ApiException.unauthorized("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        return issueToken(member);
    }

    private LoginResponse issueToken(Member member) {
        String token = jwtProvider.createAccessToken(member.getId(), member.getNickname());
        return new LoginResponse(token, member.getId(), member.getNickname());
    }
}
