package com.nhj.portfolio.domain.comment;

import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentCreateRequest;
import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentPageResponse;
import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentResponse;
import com.nhj.portfolio.domain.comment.dto.CommentDtos.CommentUpdateRequest;
import com.nhj.portfolio.domain.member.Member;
import com.nhj.portfolio.domain.member.MemberRepository;
import com.nhj.portfolio.global.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 루트 댓글 페이징 + 각 루트의 대댓글을 묶어서 반환.
     */
    @Transactional(readOnly = true)
    public CommentPageResponse getComments(int page, int size, Long currentMemberId) {
        Page<Comment> roots = commentRepository.findByParentIsNullOrderByIdDesc(PageRequest.of(page, size));

        Map<Long, List<Comment>> repliesByParent = roots.isEmpty()
                ? Map.of()
                : commentRepository.findAllByParentIn(roots.getContent()).stream()
                        .collect(Collectors.groupingBy(reply -> reply.getParent().getId()));

        List<CommentResponse> comments = roots.getContent().stream()
                .map(root -> CommentResponse.of(root, currentMemberId,
                        repliesByParent.getOrDefault(root.getId(), List.of()).stream()
                                .map(reply -> CommentResponse.of(reply, currentMemberId, List.of()))
                                .toList()))
                .toList();

        return new CommentPageResponse(comments, page, roots.getTotalPages(), roots.getTotalElements());
    }

    @Transactional
    public CommentResponse create(CommentCreateRequest request, Long currentMemberId) {
        Comment parent = null;
        if (request.parentId() != null) {
            parent = findComment(request.parentId());
            if (parent.getParent() != null) {
                throw ApiException.badRequest("대댓글에는 답글을 달 수 없습니다.");
            }
            if (parent.isDeleted()) {
                throw ApiException.badRequest("삭제된 댓글에는 답글을 달 수 없습니다.");
            }
        }

        Comment comment;
        if (currentMemberId != null) {
            Member member = memberRepository.findById(currentMemberId)
                    .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));
            comment = Comment.builder()
                    .parent(parent)
                    .member(member)
                    .content(request.content())
                    .build();
        } else {
            if (!StringUtils.hasText(request.guestNickname()) || !StringUtils.hasText(request.guestPassword())) {
                throw ApiException.badRequest("게스트 댓글은 닉네임과 비밀번호가 필요합니다.");
            }
            comment = Comment.builder()
                    .parent(parent)
                    .guestNickname(request.guestNickname())
                    .guestPassword(passwordEncoder.encode(request.guestPassword()))
                    .content(request.content())
                    .build();
        }

        Comment saved = commentRepository.save(comment);
        return CommentResponse.of(saved, currentMemberId, List.of());
    }

    @Transactional
    public CommentResponse update(Long commentId, CommentUpdateRequest request, Long currentMemberId) {
        Comment comment = findComment(commentId);
        verifyOwnership(comment, currentMemberId, request.guestPassword());

        if (comment.isDeleted()) {
            throw ApiException.badRequest("삭제된 댓글은 수정할 수 없습니다.");
        }

        comment.updateContent(request.content());
        return CommentResponse.of(comment, currentMemberId, List.of());
    }

    /**
     * 대댓글이 남아 있으면 soft delete(내용 마스킹), 없으면 실제 삭제.
     */
    @Transactional
    public void delete(Long commentId, String guestPassword, Long currentMemberId) {
        Comment comment = findComment(commentId);
        verifyOwnership(comment, currentMemberId, guestPassword);

        if (commentRepository.existsByParent(comment)) {
            comment.softDelete();
        } else {
            commentRepository.delete(comment);
        }
    }

    private Comment findComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> ApiException.notFound("댓글을 찾을 수 없습니다."));
    }

    private void verifyOwnership(Comment comment, Long currentMemberId, String guestPassword) {
        if (comment.isGuest()) {
            if (!StringUtils.hasText(guestPassword)
                    || !passwordEncoder.matches(guestPassword, comment.getGuestPassword())) {
                throw ApiException.forbidden("비밀번호가 일치하지 않습니다.");
            }
        } else {
            if (currentMemberId == null || !currentMemberId.equals(comment.getMember().getId())) {
                throw ApiException.forbidden("본인이 작성한 댓글만 수정/삭제할 수 있습니다.");
            }
        }
    }
}
