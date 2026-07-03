package com.nhj.portfolio.domain.comment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = {"member"})
    Page<Comment> findByParentIsNullOrderByIdDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"member"})
    @Query("select c from Comment c where c.parent in :parents order by c.id asc")
    List<Comment> findAllByParentIn(@Param("parents") List<Comment> parents);

    boolean existsByParent(Comment parent);

    long countByDeletedFalse();
}
