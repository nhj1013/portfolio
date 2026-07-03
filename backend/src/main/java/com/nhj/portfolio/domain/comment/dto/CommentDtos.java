package com.nhj.portfolio.domain.comment.dto;

import com.nhj.portfolio.domain.comment.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class CommentDtos {

    private CommentDtos() {
    }

    public record CommentCreateRequest(
            Long parentId,

            @NotBlank(message = "내용을 입력해 주세요.")
            @Size(max = 2000, message = "댓글은 2000자 이내로 작성해 주세요.")
            String content,

            // 게스트 전용 필드 (로그인 시 무시)
            @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
            String guestNickname,

            @Size(min = 4, max = 30, message = "비밀번호는 4자 이상이어야 합니다.")
            String guestPassword
    ) {
    }

    public record CommentUpdateRequest(
            @NotBlank(message = "내용을 입력해 주세요.")
            @Size(max = 2000, message = "댓글은 2000자 이내로 작성해 주세요.")
            String content,

            String guestPassword
    ) {
    }

    public record CommentDeleteRequest(String guestPassword) {
    }

    public record CommentResponse(
            Long id,
            Long parentId,
            String nickname,
            boolean guest,
            boolean deleted,
            boolean mine,
            String content,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<CommentResponse> replies
    ) {
        public static CommentResponse of(Comment comment, Long currentMemberId, List<CommentResponse> replies) {
            boolean mine = !comment.isGuest()
                    && currentMemberId != null
                    && currentMemberId.equals(comment.getMember().getId());
            return new CommentResponse(
                    comment.getId(),
                    comment.getParent() == null ? null : comment.getParent().getId(),
                    comment.isGuest() ? comment.getGuestNickname() : comment.getMember().getNickname(),
                    comment.isGuest(),
                    comment.isDeleted(),
                    mine,
                    comment.isDeleted() ? "삭제된 댓글입니다." : comment.getContent(),
                    comment.getCreatedAt(),
                    comment.getUpdatedAt(),
                    replies
            );
        }
    }

    public record CommentPageResponse(
            List<CommentResponse> comments,
            int page,
            int totalPages,
            long totalCount
    ) {
    }
}
