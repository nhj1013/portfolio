package com.nhj.portfolio.domain.comment;

import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentCreateRequest;
import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentDeleteRequest;
import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentPageResponse;
import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentResponse;
import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Comment", description = "댓글 / 대댓글")
@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "댓글 목록 조회 (루트 댓글 페이징 + 대댓글 포함)")
    @GetMapping
    public CommentPageResponse getComments(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size,
                                           Authentication authentication) {
        return commentService.getComments(page, Math.min(size, 50), currentMemberId(authentication));
    }

    @Operation(summary = "댓글 작성 (로그인 회원 또는 게스트)")
    @PostMapping
    public CommentResponse create(@Valid @RequestBody CommentCreateRequest request,
                                  Authentication authentication) {
        return commentService.create(request, currentMemberId(authentication));
    }

    @Operation(summary = "댓글 수정")
    @PutMapping("/{commentId}")
    public CommentResponse update(@PathVariable Long commentId,
                                  @Valid @RequestBody CommentUpdateRequest request,
                                  Authentication authentication) {
        return commentService.update(commentId, request, currentMemberId(authentication));
    }

    @Operation(summary = "댓글 삭제 (대댓글이 있으면 soft delete)")
    @DeleteMapping("/{commentId}")
    public void delete(@PathVariable Long commentId,
                       @RequestBody(required = false) CommentDeleteRequest request,
                       Authentication authentication) {
        String guestPassword = request == null ? null : request.guestPassword();
        commentService.delete(commentId, guestPassword, currentMemberId(authentication));
    }

    private Long currentMemberId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long memberId)) {
            return null;
        }
        return memberId;
    }
}
