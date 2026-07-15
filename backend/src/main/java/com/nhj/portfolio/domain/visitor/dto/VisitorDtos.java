package com.nhj.portfolio.domain.visitor.dto;

public class VisitorDtos {

    public record VisitorCountResponse(
            long today,
            long total
    ) {
    }
}
