package com.pawback.backend.listing.dto;

import com.pawback.backend.listing.Comment;
import java.time.LocalDateTime;

public record CommentDto(
        Long id,
        String content,
        UserDto author,
        LocalDateTime createdAt
) {
    public static CommentDto from(Comment comment) {
        return new CommentDto(
                comment.getId(),
                comment.getContent(),
                UserDto.from(comment.getAuthor()),
                comment.getCreatedAt()
        );
    }
}
